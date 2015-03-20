var FormInput = React.createClass({
    handleChange: function(event) {
        this.props.onValueChange(event.target.value);
    },
    render: function() {
        return (
            <div className="form-group">
              <label className="col-sm-2 control-label">{this.props.label}</label>
              <div className="col-sm-10">
                <input className="form-control" placeholder={this.props.placeholder} value={this.props.value}
                onChange={this.handleChange}/>
              </div>
            </div>
        );
    }
});

var FormTextArea = React.createClass({
    handleChange: function(event) {
        this.props.onValueChange(event.target.value);
    },
    render: function() {
        return (
            <div className="form-group">
                <label className="col-sm-2 control-laber">{this.props.label}</label>
                <div className="col-sm-10">
                    <textarea className="form-control" rows={this.props.rows} value={this.props.value}
                    onChange={this.handleChange}></textarea>
                </div>
            </div>
        );
    }
});

var FormButton = React.createClass({
   render: function() {
       return (
            <button type="button" className={this.props.class} onClick={this.props.onClick} disabled={this.props
            .disabled}>{this.props.label}</button>
       );
   }
});

var DataList = React.createClass({
    render: function() {
        // render headers
        var dataHeaders;
        if(this.props.data[0]) {
            var keys = Object.keys(this.props.data[0]);
            // remove areNew attribute for display
            if(keys.indexOf('areNew') != -1) keys.splice(keys.indexOf('areNew'), 1);
            dataHeaders = keys.map(function(item) {
                return (
                        <th>{item}</th>
                );
            });
        }
        // render lines
        var dataLines = this.props.data.map(function(item, index) {
            return (
                <DataLine item={item}/>
            );
        });
        return (
            <div className="row">
                <table className="table table-striped table-bordered table-hover table-condensed">
                    <tbody>
                        <tr>
                            {dataHeaders}
                        </tr>
                        {dataLines}
                    </tbody>
                </table>
            </div>
        );
    }
});

var DataLine = React.createClass({
    render: function() {
        var dataLine = this.props.item;
        var dataCells = $.map(dataLine, function(cell, index) {
            if(index != "areNew") { // remove areNew attribute for display
                var classString = dataLine.areNew && dataLine.areNew.indexOf(index) == -1 ? "" : "success";
                // convert json to string for nested json objects
                cell = typeof cell == "object" ? JSON.stringify(cell) : cell;
                return (
                    <td className={classString}>{cell}</td>
                );
            }
        });
        return (
            <tr>
                {dataCells}
            </tr>
        );
    }
});

var streamdata;

var StreamDataBox = React.createClass({
    connect: function() {

        // create the Streamdata source
        streamdata = streamdataio.createEventSource(this.state.url, this.state.headers);

        streamdata.streamdataConfig.PROTOCOL = 'https://';
        streamdata.streamdataConfig.HOST = 'proxy.streamdata.io';
        streamdata.streamdataConfig.PORT = '';

        var currentSDBox = this;

        // add a callback when the connection is opened
        streamdata.onOpen(function () {
            console.log('Connection is opened');
            currentSDBox.setState({isConnected: true});
        });

        // add a callback when data is sent by streamdata.io
        streamdata.onData(function (data) {
            console.log('Received data: ' + JSON.stringify(data));
            currentSDBox.setState({data: data});
        });

        // add a callback when a patch is sent by streamdata.io
        streamdata.onPatch(function (patch) {
            console.log('Received patch:' + JSON.stringify(patch));

            // add isNew property to highlight changes
            var oldDatas = currentSDBox.state.data.map(function(item, index) {
                item.areNew = new Array();
                return item;
            });
            patch.forEach(function(item) {
                var index = parseInt(item.path.substring(1, item.path.indexOf('/', 1)));
                var attribute = item.path.substring(item.path.indexOf('/', 1) + 1);
                // we keep only first level attribute
                if(attribute.indexOf('/') != -1) attribute = attribute.substring(0,attribute.indexOf('/'));
                oldDatas[index].areNew.push(attribute);
            });

            // apply json patch
            jsonpatch.apply(currentSDBox.state.data, patch);
            currentSDBox.setState({data: currentSDBox.state.data});
        });

        // add a callback on error
        streamdata.onError(function (error) {
            console.log("Error : " + error);
            currentSDBox.setState({isConnected: false});
        });

        // open the streamdata.io connection
        streamdata.open();
    },
    disconnect: function() {
        // close the streamdata.io connection
        streamdata.close();
        this.setState({isConnected: false});
    },
    getInitialState: function() {
        return {
            data: [],
            url: this.props.url,
            headers: this.props.headers,
            isConnected: false
        };
    },
    onUrlChange: function(newUrl) {
        this.setState({url: newUrl});
    },
    onHeadersChange: function(newHeaders) {
        this.setState({headers: newHeaders});
    },
    render: function() {
        return(
            <div>
                <form className="form-horizontal" name="streamdataForm">
                    <FormInput label="URL" placeholder="Your JSON API Url" value={this.state.url} onValueChange={this
                    .onUrlChange}/>
                    <FormTextArea label="Specific Headers" rows="3" value={this.state.headers} onValueChange={this
                    .onHeadersChange}/>
                    <div className="form-group">
                        <div className="col-sm-offset-2 col-sm-6">
                            <FormButton class="btn btn-success" label="Connect" onClick={this.connect} disabled={this
                            .state.isConnected}/>
                            <FormButton class="btn btn-danger" label="Disconnect" onClick={this.disconnect}
                            disabled={!this.state.isConnected}/>
                        </div>
                    </div>
                </form>

                <DataList data={this.state.data}/>

                <div className="footer">
                    <p>♥ from the Streamdata.io team</p>
                </div>
            </div>
        );
    }
});

React.render(
  <StreamDataBox url="http://motwindemo-stockmarket.rhcloud.com/app/stockmarket/prices" headers=""/>,
  document.getElementById('content')
);
import { StreamdataioAngularPage } from './app.po';

describe('streamdataio-angular App', () => {
  let page: StreamdataioAngularPage;

  beforeEach(() => {
    page = new StreamdataioAngularPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});

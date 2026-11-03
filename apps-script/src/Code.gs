function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Wissensbau')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function include_(name) {
  if (['Styles', 'Fonts', 'Translations', 'Client'].indexOf(name) < 0) throw new Error('TEMPLATE_INVALID');
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

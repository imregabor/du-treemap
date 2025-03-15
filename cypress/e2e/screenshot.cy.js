describe('Take a screenshot of the page', () => {
  it('Loads the static HTML and takes a screenshot', () => {
    cy.visit('dist/index.html');
    cy.screenshot('screenshot-1', { overwrite : true, capture: 'fullPage' });
    cy.get('#flat-layout').click();
    cy.wait(1500);
    cy.screenshot('screenshot-2', { overwrite : true, capture: 'fullPage' });
  });
});

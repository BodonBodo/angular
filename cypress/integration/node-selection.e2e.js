describe('node selection', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('logic after change detection', () => {
    it('should deselect node if it is no longer on the page', () => {
      cy.get('.tree-wrapper').get('.tree-node.selected').should('not.exist');

      cy.get('.tree-wrapper').find('.tree-node:contains("app-todo[TooltipDirective]")').first().click({ force: true });

      cy.get('.tree-wrapper').find('.tree-node.selected').its('length').should('eq', 1);

      cy.enter('#sample-app').then((getBody) => {
        getBody().find('a:contains("About")').click();
      });

      cy.get('.tree-wrapper').get('.tree-node.selected').should('not.exist');
    });

    it('should reselect the previously selected node if it is still present', () => {
      cy.get('.tree-wrapper').get('.tree-node.selected').should('not.exist');

      cy.enter('#sample-app').then((getBody) => {
        getBody().find('input.new-todo').type('Buy cookies{enter}');
      });

      cy.get('.tree-wrapper').find('.tree-node:contains("app-todo[TooltipDirective]")').last().click({ force: true });

      cy.enter('#sample-app').then((getBody) => {
        getBody().find('app-todo:contains("Buy milk")').find('.destroy').click();
      });

      cy.get('.tree-wrapper').find('.tree-node.selected').its('length').should('eq', 1);
    });

    it('should select nodes with same name', () => {
      cy.get('.tree-wrapper').find('.tree-node:contains("app-todo[TooltipDirective]")').first().click({ force: true });

      cy.get('.tree-wrapper').find('.tree-node:contains("app-todo[TooltipDirective]")').last().click({ force: true });

      cy.get('ng-property-view').last().find('mat-tree-node:contains("todo")').click();

      cy.get('ng-property-view').last().find('mat-tree-node:contains("Save the world")').its('length').should('eq', 1);
    });
  });

  describe('breadcrumb logic', () => {
    it('should overflow when breadcrumb list is long enough', () => {
      cy.get('.tree-wrapper')
        .find('.tree-node:contains("div[TooltipDirective]")')
        .last()
        .click({ force: true })
        .then(() => {
          cy.get('ng-breadcrumbs')
            .find('.breadcrumbs')
            .then((breadcrumbsContainer) => {
              const hasOverflowX = () => breadcrumbsContainer[0].scrollWidth > breadcrumbsContainer[0].clientWidth;
              expect(hasOverflowX()).to.be.true;
            });
        });
    });

    it('should scroll right when right scroll button is clicked', () => {
      cy.get('.tree-wrapper')
        .find('.tree-node:contains("div[TooltipDirective]")')
        .last()
        .click({ force: true })
        .then(() => {
          cy.get('ng-breadcrumbs')
            .find('.breadcrumbs')
            .then((breadcrumbsContainer) => {
              const scrollLeft = () => breadcrumbsContainer[0].scrollLeft;
              expect(scrollLeft()).to.eql(0);

              cy.get('ng-breadcrumbs')
                .find('.scroll-button')
                .last()
                .click()
                .wait(150) // wait for scroll animation to end
                .then(() => {
                  expect(scrollLeft()).to.eql(15);
                });
            });
        });
    });

    it('should scroll left when left scroll button is clicked', () => {
      cy.get('.tree-wrapper')
        .find('.tree-node:contains("div[TooltipDirective]")')
        .last()
        .click({ force: true })
        .then(() => {
          cy.get('ng-breadcrumbs')
            .find('.breadcrumbs')
            .then((breadcrumbsContainer) => {
              const scrollLeft = () => breadcrumbsContainer[0].scrollLeft;
              expect(scrollLeft()).to.eql(0);

              cy.get('ng-breadcrumbs')
                .find('.scroll-button')
                .last()
                .click()
                .wait(150) // wait for scroll animation to end
                .then(() => {
                  expect(scrollLeft()).to.eql(15);

                  cy.get('ng-breadcrumbs')
                    .find('.scroll-button')
                    .first()
                    .click()
                    .wait(150) // wait for scroll animation to end
                    .then(() => {
                      expect(scrollLeft()).to.eql(0);
                    });
                });
            });
        });
    });
  });
});

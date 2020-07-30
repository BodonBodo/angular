import { browser, element, by } from 'protractor';

describe('AngularJS to Angular Quick Reference Tests', () => {

  beforeAll(() => {
    browser.get('');
  });

  it('should display no poster images after bootstrap', () => {
    testImagesAreDisplayed(false);
  });

  it('should display proper movie data', () => {
    // We check only a few samples
    let expectedSamples: any[] = [
      {row: 0, column: 0, element: 'img', attr: 'src', value: 'images/hero.png', contains: true},
      {row: 0, column: 2, value: 'Celeritas'},
      {row: 1, column: 3, matches: /Dec 1[678], 2015/}, // absorb timezone dif; we care about date format
      {row: 1, column: 5, value: '$14.95'},
      {row: 2, column: 4, value: 'PG-13'},
      {row: 2, column: 7, value: '100%'},
      {row: 2, column: 0, element: 'img', attr: 'src', value: 'images/ng-logo.png', contains: true},
    ];

    // Go through the samples
    let movieRows = getMovieRows();
    for (let i = 0; i < expectedSamples.length; i++) {
      let sample = expectedSamples[i];
      let tableCell = movieRows.get(sample.row)
        .all(by.tagName('td')).get(sample.column);
      // Check the cell or its nested element
      let elementToCheck = sample.element
        ? tableCell.element(by.tagName(sample.element))
        : tableCell;

      // Check element attribute or text
      let valueToCheck = sample.attr
        ? elementToCheck.getAttribute(sample.attr)
        : elementToCheck.getText();

      // Test for equals/contains/match
      if (sample.contains) {
        expect(valueToCheck).toContain(sample.value);
      } else if (sample.matches) {
        expect(valueToCheck).toMatch(sample.matches);
      } else {
        expect(valueToCheck).toEqual(sample.value);
      }
    }
  });

  it('should display images after Show Poster', () => {
    testPosterButtonClick('Show Poster', true);
  });

  it('should hide images after Hide Poster', () => {
    testPosterButtonClick('Hide Poster', false);
  });

  it('should display no movie when no favorite hero is specified', () => {
    testFavoriteHero(null, 'Please enter your favorite hero.');
  });

  it('should display no movie for Magneta', () => {
    testFavoriteHero('Magneta', 'No movie, sorry!');
  });

  it('should display a movie for Dr Nice', () => {
    testFavoriteHero('Dr Nice', 'Excellent choice!');
  });

  function testImagesAreDisplayed(isDisplayed: boolean) {
    let expectedMovieCount = 3;

    let movieRows = getMovieRows();
    expect(movieRows.count()).toBe(expectedMovieCount);
    for (let i = 0; i < expectedMovieCount; i++) {
      let movieImage = movieRows.get(i).element(by.css('td > img'));
      expect(movieImage.isDisplayed()).toBe(isDisplayed);
    }
  }

  function testPosterButtonClick(expectedButtonText: string, isDisplayed: boolean) {
    let posterButton = element(by.css('app-movie-list tr > th > button'));
    expect(posterButton.getText()).toBe(expectedButtonText);

    posterButton.click().then(() => {
      testImagesAreDisplayed(isDisplayed);
    });
  }

  function getMovieRows() {
    return element.all(by.css('app-movie-list tbody > tr'));
  }

  function testFavoriteHero(heroName: string, expectedLabel: string) {
    let movieListComp = element(by.tagName('app-movie-list'));
    let heroInput = movieListComp.element(by.tagName('input'));
    let favoriteHeroLabel = movieListComp.element(by.tagName('h3'));
    let resultLabel = movieListComp.element(by.css('span > p'));

    heroInput.clear().then(() => {
      heroInput.sendKeys(heroName || '');
      expect(resultLabel.getText()).toBe(expectedLabel);
      if (heroName) {
        expect(favoriteHeroLabel.isDisplayed()).toBe(true);
        expect(favoriteHeroLabel.getText()).toContain(heroName);
      } else {
        expect(favoriteHeroLabel.isDisplayed()).toBe(false);
      }
    });
  }
});

import { indexForest } from './index-forest';

describe('indexForest', () => {
  it('should work with an empty forest', () => {
    expect(indexForest([])).toEqual([]);
  });

  it('should index a forest', () => {
    expect(
      indexForest([
        {
          element: 'Parent1',
          directives: [],
          component: {
            name: 'Cmp1',
          },
          children: [
            {
              element: 'Child1_1',
              directives: [
                {
                  name: 'Dir1',
                },
                {
                  name: 'Dir2',
                },
              ],
              component: null,
              children: [],
            },
            {
              element: 'Child1_2',
              directives: [],
              component: {
                name: 'Cmp2',
              },
              children: [],
            },
          ],
        },
        {
          element: 'Parent2',
          directives: [],
          component: null,
          children: [
            {
              element: 'Child2_1',
              directives: [
                {
                  name: 'Dir3',
                },
              ],
              component: null,
              children: [],
            },
            {
              element: 'Child2_2',
              directives: [
                {
                  name: 'Dir4',
                },
                {
                  name: 'Dir5',
                },
              ],
              component: null,
              children: [],
            },
          ],
        },
      ])
    ).toEqual([
      {
        element: 'Parent1',
        directives: [],
        id: [0],
        component: {
          name: 'Cmp1',
        },
        children: [
          {
            element: 'Child1_1',
            id: [0, 0],
            directives: [
              {
                name: 'Dir1',
              },
              {
                name: 'Dir2',
              },
            ],
            component: null,
            children: [],
          },
          {
            element: 'Child1_2',
            directives: [],
            id: [0, 1],
            component: {
              name: 'Cmp2',
            },
            children: [],
          },
        ],
      },
      {
        element: 'Parent2',
        directives: [],
        component: null,
        id: [1],
        children: [
          {
            element: 'Child2_1',
            id: [1, 0],
            directives: [
              {
                name: 'Dir3',
              },
            ],
            component: null,
            children: [],
          },
          {
            element: 'Child2_2',
            id: [1, 1],
            directives: [
              {
                name: 'Dir4',
              },
              {
                name: 'Dir5',
              },
            ],
            component: null,
            children: [],
          },
        ],
      },
    ]);
  });
});

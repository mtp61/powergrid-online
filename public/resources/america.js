const map = {
    1: {"name": "Seattle",
        "x": 1,
        "y": 1,
        "region": 1, 
        "connections": {2: 3, 3: 12, 4: 9}},
    2: {"name": "Portland",
        "x": 1,
        "y": 3,
        "region": 1, 
        "connections": {1: 3, 3: 13, 8: 24}},
    3: {"name": "Boise",
        "x": 3,
        "y": 4,
        "region": 1, 
        "connections": {1: 12, 2: 13, 4: 12, 8: 23, 9: 8}},
    4: {"name": "Billings",
        "x": 4,
        "y": 2,
        "region": 1, 
        "connections": {1: 9, 3: 12, 5: 9, 15: 17, 17: 18}},
    5: {"name": "Cheyenne",
        "x": 6,
        "y": 5,
        "region": 1, 
        "connections": {4: 9, 6: 0, 7: 14, 17: 18}},
    6: {"name": "Denver",
        "x": 6,
        "y": 7,
        "region": 1, 
        "connections": {5: 0, 9: 21, 14: 13, 22: 16}},
    7: {"name": "Omaha",
        "x": 9,
        "y": 5,
        "region": 1, 
        "connections": {5: 14, 17: 8, 18: 12, 22: 5}},
    8: {"name": "San Francisco",
        "x": 1,
        "y": 7,
        "region": 2, 
        "connections": {2: 24, 3: 23, 9: 27, 10: 14, 11: 9}},
    9: {"name": "Salt Lake City",
        "x": 4,
        "y": 6,
        "region": 2, 
        "connections": {3: 8, 6: 21, 8: 27, 10: 18, 14: 28}},
    10: {"name": "Las Vegas",
        "x": 3,
        "y": 8,
        "region": 2, 
        "connections": {8: 14, 9: 18, 11: 9, 12: 9, 13: 15, 14: 27}},
    11: {"name": "Los Angeles",
        "x": 2,
        "y": 10,
        "region": 2, 
        "connections": {8: 9, 10: 9, 12: 3}},
    12: {"name": "San Diego",
        "x": 3,
        "y": 12,
        "region": 2, 
        "connections": {10: 9, 11: 3, 13: 14}},
    13: {"name": "Phoenix",
        "x": 5,
        "y": 11,
        "region": 2, 
        "connections": {10: 15, 12: 14, 14: 18}},
    14: {"name": "Santa Fe",
        "x": 6,
        "y": 9,
        "region": 2, 
        "connections": {10: 27, 13: 18, 9: 28, 6: 13, 22: 16, 23: 15, 25: 16, 27: 20}},
    15: {"name": "Fargo",
        "x": 10,
        "y": 3,
        "region": 3, 
        "connections": {4: 17, 16: 6, 17: 6}},
    16: {"name": "Duluth",
        "x": 12,
        "y": 2,
        "region": 3, 
        "connections": {15: 6, 17: 5, 18: 12, 29: 15}},
    17: {"name": "Minneapolis",
        "x": 12,
        "y": 4,
        "region": 3, 
        "connections": {4: 18, 5: 18, 7: 8, 15: 6, 16: 5, 18: 8}},
    18: {"name": "Chicago",
        "x": 13,
        "y": 6,
        "region": 3, 
        "connections": {7: 12, 16: 12, 17: 8, 22: 8, 19: 10, 20: 7, 29: 7}},
    19: {"name": "St Louis",
        "x": 12,
        "y": 8,
        "region": 3, 
        "connections": {18: 10, 22: 6, 24: 7, 38: 12, 20: 12}},
    20: {"name": "Cincinnati",
        "x": 15,
        "y": 7,
        "region": 3, 
        "connections": {18: 7, 19: 12, 21: 6, 31: 7, 29: 4}},
    21: {"name": "Knoxville",
        "x": 15,
        "y": 9,
        "region": 3, 
        "connections": {20: 6, 38: 5, 37: 11}},
    22: {"name": "Kansas City",
        "x": 9,
        "y": 8,
        "region": 4, 
        "connections": {7: 5, 6: 16, 14: 16, 23: 8, 24: 12, 19: 6, 18: 8}},
    23: {"name": "Oklahoma City",
        "x": 9,
        "y": 10,
        "region": 4, 
        "connections": {22: 8, 14: 15, 25: 3, 24: 14}},
    24: {"name": "Memphis",
        "x": 12,
        "y": 10,
        "region": 4, 
        "connections": {19: 7, 22: 12, 23: 14, 25: 12, 28: 7, 26: 6}},
    25: {"name": "Dallas",
        "x": 9,
        "y": 12,
        "region": 4, 
        "connections": {23: 3, 14: 16, 27: 5, 28: 12, 24: 12}},
    26: {"name": "Birmingham",
        "x": 13,
        "y": 12,
        "region": 4, 
        "connections": {24: 6, 28: 11, 40: 9, 38: 3}},
    27: {"name": "Houston",
        "x": 9,
        "y": 14,
        "region": 4, 
        "connections": {25: 5, 14: 20, 28: 8}},
    28: {"name": "New Orleans",
        "x": 12,
        "y": 14,
        "region": 4, 
        "connections": {24: 7, 25: 12, 27: 8, 40: 16, 26: 11}},
    29: {"name": "Detroit",
        "x": 15,
        "y": 4,
        "region": 5, 
        "connections": {16: 15, 18: 7, 20: 4, 31: 6, 30: 7}},
    30: {"name": "Ithaca",
        "x": 17,
        "y": 3,
        "region": 5, 
        "connections": {29: 7, 31: 7, 33: 8}},
    31: {"name": "Pittsburgh",
        "x": 17,
        "y": 5,
        "region": 5, 
        "connections": {30: 7, 29: 6, 20: 7, 37: 7, 35: 6}},
    32: {"name": "Boston",
        "x": 21,
        "y": 2,
        "region": 5, 
        "connections": {33: 3}},
    33: {"name": "New Haven",
        "x": 20,
        "y": 4,
        "region": 5, 
        "connections": {32: 3, 30: 8, 34: 0}},
    34: {"name": "New York",
        "x": 20,
        "y": 6,
        "region": 5, 
        "connections": {33: 0, 35: 3}},
    35: {"name": "Washington DC",
        "x": 18,
        "y": 7,
        "region": 5, 
        "connections": {34: 3, 31: 6, 36: 5}},
    36: {"name": "Norfolk",
        "x": 20,
        "y": 8,
        "region": 6, 
        "connections": {35: 5, 37: 3}},
    37: {"name": "Raleigh",
        "x": 18,
        "y": 9,
        "region": 6, 
        "connections": {36: 3, 31: 7, 21: 11, 38: 7, 39: 7}},
    38: {"name": "Atlanta",
        "x": 15,
        "y": 11,
        "region": 6, 
        "connections": {21: 5, 26: 3, 39: 7, 37: 7}},
    39: {"name": "Savannah",
        "x": 18,
        "y": 11,
        "region": 6, 
        "connections": {37: 7, 38: 7, 40: 0}},
    40: {"name": "Jacksonville",
        "x": 17,
        "y": 13,
        "region": 6, 
        "connections": {39: 0, 26: 9, 28: 16, 41: 4}},
    41: {"name": "Tampa",
        "x": 15,
        "y": 14,
        "region": 6, 
        "connections": {40: 4, 42: 4}},
    42: {"name": "Miami",
        "x": 18,
        "y": 15,
        "region": 6, 
        "connections": {41: 4}},
}

const restocks = {3: {1: {"c": 4, "o": 2, "t": 1, "u": 3},
                      2: {"c": 5, "o": 3, "t": 2, "u": 3},
                      3: {"c": 3, "o": 4, "t": 3, "u": 2}}, 
                  4: {1: {"c": 5, "o": 3, "t": 2, "u": 2},
                      2: {"c": 6, "o": 4, "t": 3, "u": 3},
                      3: {"c": 4, "o": 5, "t": 4, "u": 2}}, 
                  5: {1: {"c": 5, "o": 4, "t": 3, "u": 2},
                      2: {"c": 7, "o": 5, "t": 3, "u": 2},
                      3: {"c": 5, "o": 6, "t": 5, "u": 1}}, 
                  6: {1: {"c": 7, "o": 5, "t": 3, "u": 1},
                      2: {"c": 9, "o": 6, "t": 5, "u": 1},
                      3: {"c": 6, "o": 7, "t": 6, "u": 1}}
}
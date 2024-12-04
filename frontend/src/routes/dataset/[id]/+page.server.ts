import {PRIVATE_BASE_URL} from "$env/static/private";

interface Props {
    params: {id: string};
}

export async function load({ params }: Props) {
    const queries = [getCoursesWithHighestAverage, getCoursesAverageOverTheYears, getCoursesWithLowPassFailRatio];
    const responses =  await Promise.all(queries.map(query => query(params.id)));
    return { results: await Promise.all(responses.map(async response => await response.json())) }
}

function getCoursesWithHighestAverage(datasetId: string): Promise<Response> {
    const query = `{
        "WHERE": {
            "AND": [
                {
                    "GT": {
                        "${datasetId}_avg": 90
                    }
                },
                {
                    "GT": {
                        "${datasetId}_year": 1901
                    }
                }
            ]
        },
        "OPTIONS": {
            "COLUMNS": [
                "${datasetId}_id",
                "${datasetId}_dept",
                "${datasetId}_avg"
            ],
            "ORDER": {
                "dir": "DOWN",
                "keys": ["${datasetId}_avg"]
            }
        }
    }`;
    return fetch(`${PRIVATE_BASE_URL}/query`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: query,
    })
}

function getCoursesAverageOverTheYears(datasetId: string): Promise<Response> {
    const query = `
    {
        "WHERE": {
            "GT": {
              "${datasetId}_year": 1900
            }
        },
        "OPTIONS": {
            "COLUMNS": [
              "${datasetId}_dept",
              "overallAvg",
              "${datasetId}_year"
            ],
            "ORDER": {
              "keys": ["${datasetId}_dept", "${datasetId}_year"],
              "dir": "UP"
            }
        },
        "TRANSFORMATIONS": {
            "GROUP": [
              "${datasetId}_dept",
              "${datasetId}_year"
            ],
            "APPLY": [
              {
                "overallAvg": {
                  "AVG": "${datasetId}_avg"
                }
              }
            ]
        }
    }`
    return fetch(`${PRIVATE_BASE_URL}/query`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: query,
    })
}

function getCoursesWithLowPassFailRatio(datasetId: string) {
    const query = `
    {
        "WHERE": {
        "AND": [
            {
                "LT": {
                    "${datasetId}_avg": 50
                }
            },
            {
                "GT": {
                    "${datasetId}_year": 1900
                }
            }
        ]
    },
        "OPTIONS": {
        "COLUMNS": [
            "${datasetId}_pass",
            "${datasetId}_fail",
            "${datasetId}_id",
            "${datasetId}_dept",
            "${datasetId}_avg"
        ],
            "ORDER": {
            "keys": ["${datasetId}_avg"],
                "dir": "UP"
            }
        }
    }`
    return fetch(`${PRIVATE_BASE_URL}/query`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: query,
    })
}


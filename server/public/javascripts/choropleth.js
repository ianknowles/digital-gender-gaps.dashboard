let csvdata = {};
let csvdatalist = [];
let csv_url = "";

let datestring = ""
let base_url = "https://s3.eu-west-3.amazonaws.com/www.digitalgendergaps.org/";

let sortAscending = false;
const mapName = 'map';

function createdatamap(id) {
	//TODO using a local var but should be able to access this.fills.defaultFill when its needed
	let defaultFill = '#F5F5F5';
    return new Datamap({
        element: document.getElementById(id),
        projection: 'equirectangular',
        responsive: true,
        //aspectRatio: 0.6785714285714286,
        //aspectRatio: 0.5625,
        aspectRatio: 0.5,
        fills: {defaultFill: defaultFill},
        data: {},
        geographyConfig: {
            borderColor: '#DEDEDE',
            highlightBorderWidth: 2,
            highlightFillColor: function (geo) {
            	if ((!geo) || (Object.keys(geo).length === 0) || !('numberOfThings' in geo) || isNaN(geo.numberOfThings) || (geo.numberOfThings === 0)) {
            		return defaultFill;
            	}
                return geo['fillColor'] || defaultFill;
            },
            highlightBorderColor: '#B7B7B7',
            popupTemplate: function (geo, data) {
				let image_src = ""
				let data_string = ""
                if ((!data) || (Object.keys(data).length === 0) || !('numberOfThings' in data) || isNaN(data.numberOfThings) || (data.numberOfThings === 0)) {
					data_string = "No data"
				} else {
					//TODO nf.format(data.numberOfThings)
					data_string = (data.numberOfThings / 100).toFixed(3)
					//TODO routes[geo.id]
					image_src = `/assets/images/flags/${csvdata[geo.id]['ISO2Code'].toLowerCase()}.svg`
				}
				return `
					<div class="p-2" style="background: rgba(255, 255, 255, 0.7);">
						<div class="d-flex flex-row">
							${image_src ? `<div class="pr-1"><img class="shadow" src=${image_src} width="25px" alt=${geo.id}></div>` : ""}
							<div class="flex-fill">${geo.id}</div>
						</div>
						<div class="d-flex flex-row">
							<div class="pr-1">${geo.properties.name}</div>
						</div>
						<div class="d-flex flex-row">
							<div class=""><strong>${data_string}</strong></div>
						</div>
					</div>
				`
            }
        },
        done: function(datamap) {
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                // alert(geography.properties.name);
                if (document.getElementById(geography.id)) {
                	window.location.href = "#" + geography.id;
                	//anchorScroll(geography.id);
                }
            });
        }
    });
}

class DggMap {
	constructor(id_prefix) {
		this.id_prefix = id_prefix;
		this.datamap = createdatamap(this.id_prefix + '-chart-area');
		this.dataset = {};
		this.color_min_value = "#FF0000";
        this.color_max_value = "#00FF00";
	}

	clear() {
		this.dataset = {};
		this.datamap.options.data = {};
		this.datamap.updateChoropleth({}, {reset: true});
	}

	//TODO rewrite so that this expects key value pairs, trim the csv data to a single column elsewhere
	setData(column) {
		this.dataset = {};

		for (let key in csvdata) {
			let item = {};
			item['numberOfThings'] = csvdata[key][column] * 100;
			if (!isNaN(item['numberOfThings'])) {
				this.dataset[key] = item;
			}
		}
    }

	setDataCapped(column) {
		this.dataset = {};

		for (let key in csvdata) {
			let csv_value = 0;
			let value_year = 0;
			if (csvdata[key].years) {
				for (let year in csvdata[key]) {
					if (year !== 'years') {
						if (parseInt(year, 10) > value_year) {
							value_year = year
							csv_value = csvdata[key][year][column]
						}
					}
				}
			} else {
				csv_value = csvdata[key][column];
			}
			if (!isNaN(csv_value)) {
				if (csv_value > 1) {
					this.dataset[key] = {numberOfThings: 100};
				} else if (csv_value  > 0) {
					this.dataset[key] = {numberOfThings: csv_value * 100};
				}
			}
		}
    }

	get minValue() {
		let range = Object.keys(this.dataset).map(key => this.dataset[key]['numberOfThings']);
		return Math.min.apply(null, range);
	}

	get maxValue() {
		let range = Object.keys(this.dataset).map(key => this.dataset[key]['numberOfThings']);
		return Math.max.apply(null, range);
	}

	get colour_min_value() {
		return this.color_min_value;
	}

	set colour_min_value(color) {
		this.color_min_value = color;
		this.updateColors();
    }

	get colour_max_value() {
		return this.color_max_value;
	}

    set colour_max_value(color) {
    	this.color_max_value = color;
		this.updateColors();
    }

	updateColors() {
		if (Object.keys(this.dataset).length === 0) {
			return;
		}
	//TODO save palettescale and recompute when colour min/max are changed via setters
		let paletteScale = d3.scale.linear()
			.domain([this.minValue, this.maxValue])
			.range([this.colour_min_value, this.colour_max_value]);

		// Datamaps expects data in format:
        // { "USA": { "fillColor": "#42a844", numberOfWhatever: 75},
        //   "FRA": { "fillColor": "#8dc386", numberOfWhatever: 43 } }
		for (let key in this.dataset) {
			if (isNaN(this.dataset[key]['numberOfThings']) || (this.dataset[key]['numberOfThings'] === 0)) {
				//get defaultFill from map
				this.dataset[key]['fillColor'] = this.datamap.options.fills.defaultFill;
			}
			else {
				this.dataset[key]['fillColor'] = paletteScale(this.dataset[key]['numberOfThings']);
			}
		}

		this.datamap.options.data = {};
		this.datamap.updateChoropleth(this.dataset, {reset: true});
		this.addLegend();
	}

	addLegend() {
		this.addVLegend();
		this.addHLegend();
		this.addColourPickers();
	}

	addVLegend() {
		let steps = d3.range(11).map(d => d3.format(".2f")((this.minValue + ((this.maxValue - this.minValue) * 0.1 * d))/100));
		steps.sort(d3.descending)

		d3.select('#' + this.id_prefix + '-v-legend-gradient')
			.attr('style', 'width: 15px; height: 95%; background: linear-gradient('
				+ this.colour_max_value + ', ' + this.colour_min_value + ')');

		d3.select('#' + this.id_prefix + '-v-legend-values').selectAll('div')
			.data(steps)
			.text(function(x) {
				if (x !== "NaN") {
					return x;
				}
			});
	}

	addHLegend() {
		let steps = d3.range(11).map(d => d3.format(".2f")((this.minValue + ((this.maxValue - this.minValue) * 0.1 * d))/100));

		d3.select('#' + this.id_prefix + '-h-legend-gradient')
			.attr('style', 'width: 92.5%; height: 15px; background: linear-gradient(to right, '
				+ this.colour_min_value + ', ' + this.colour_max_value + ')');

		d3.select('#' + this.id_prefix + '-h-legend-values').selectAll('div')
			.data(steps)
			.text(function(x) {
				if (x !== "NaN") {
					return x;
				}
			});
	}

	addColourPickers() {
		//TODO do we have a better option than declaring self to get at the object in the callback context?
		let self = this;
		d3.select('#' + this.id_prefix + '-color-min-input').attr('value', this.colour_min_value).on('change', function() {self.colour_min_value = this.value;})
		d3.select('#' + this.id_prefix + '-color-min-button').attr('style', 'background-color: ' + this.colour_min_value)
		d3.select('#' + this.id_prefix + '-color-min-link').attr('href', '/indicators#scale').text('Inequality')

		d3.select('#' + this.id_prefix + '-color-max-input').attr('value', this.colour_max_value).on('change', function() {self.colour_max_value = this.value;})
		d3.select('#' + this.id_prefix + '-color-max-button').attr('style', 'background-color: ' + this.colour_max_value)
		d3.select('#' + this.id_prefix + '-color-max-link').attr('href', '/indicators#scale').text('Equality')
	}
}

const dggmap = new DggMap(mapName);

d3.select(window).on('resize', function() {
	dggmap.datamap.resize();
});

let formDict = JSON.parse(document.getElementById('chart-setup').innerHTML);
let index_url = ''
if ('index' in formDict) {
	if (formDict['index'] === 'raw') {
	    	let picker = d3.select('#' + mapName + '-report-picker')
	    	picker.selectAll('option').remove()
        	picker.append('option').text('DGGI_july2019.csv').attr('value', 'DGGI_july2019.csv')
        	picker.append('option').text('Mobile_dataset.csv').attr('value', 'Mobile_dataset.csv')
        	picker.append('option').text('compiled_Mobile_GG_data_2018.csv').attr('value', 'compiled_Mobile_GG_data_2018.csv')
        	picker.on('change', change_dataset)
        	base_url = "/wp-content/themes/digitalgendergaps/assets/"
    d3.queue()
        .defer(d3.csv, base_url + 'DGGI_july2019.csv', function (d) {
            csvdata[d.ISO3Code] = d;
            csvdatalist.push(d);
        })
        .await(raw_map);
	} else {
		index_url = base_url + 'data/' + formDict['index'] + '.json'
		fetch_index()
	}
} else {
	index_url = base_url + "data/models2.json"
	fetch_index()
}

function fetch_index() {
d3.json(index_url, function(model_index) {
	let picker = d3.select('#' + mapName + '-report-picker')
	picker.selectAll('option').remove()
	picker
		.selectAll('option')
		.data(Object.keys(model_index).reverse())
		.enter()
		.append('option')
		.text(x => x)
		.attr('value', x => model_index[x]);
	//picker.select('option').attr('value', model_index['latest'])
	//picker.select('option').text('Latest')
	//var formData = new FormData(document.querySelector('form'))
	let formDict = JSON.parse(document.getElementById('chart-setup').innerHTML);
	//for(var pair of formData.entries()) {
	//	formDict[pair[0]] = pair[1]
	//}
	if (('report' in formDict) && (formDict['report'] in model_index)) {
		picker.property('value', model_index[formDict['report']])
		csv_url = base_url + model_index[formDict['report']];
	} else {
		picker.property('value', model_index['latest'])
		csv_url = base_url + model_index['latest'];
	}

	fetch_csv();

	picker.on('change', change_report)
})
}

function change_report() {
	csv_url = base_url + this.value;
	// https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API
	history.replaceState(null, '', `?report=${this.options[this.selectedIndex].text}`);

	csvdata = {};
	csvdatalist = [];
	dggmap.clear()

	fetch_csv();
}

function change_dataset() {
	csv_url = base_url + this.value;

	csvdata = {};
	csvdatalist = [];
	dggmap.clear()

    d3.queue()
        .defer(d3.csv, csv_url, function (d) {
        	if ('year' in d) {
        		if (d.ISO3Code in csvdata) {
        			csvdata[d.ISO3Code][d.year] = d;
        		} else {
        			csvdata[d.ISO3Code] = {years: true}
        			csvdata[d.ISO3Code][d.year] = d;
        		}
        	} else {
            	csvdata[d.ISO3Code] = d;
            }
            csvdatalist.push(d);
        })
        .await(raw_map);
}

function fetch_csv() {
    d3.queue()
        .defer(d3.csv, csv_url, function (d) {
            csvdata[d.ISO3Code] = d;
            csvdatalist.push(d);
        })
        .await(ready);
}

const tabulate = function (dict) {
	let columns = []
	for (const key in dict[0]) {
		columns.push(key)
	}
	let data = dict
	const table = d3.select('#' + mapName + '-table');
	table.select('thead').remove();
	table.select('tbody').remove();
	const thead = table.append('thead');
	const tbody = table.append('tbody');
	//.append('span').selectAll('span').data(d3.range(2)).enter()
	//.append('div').attr('class', 'col').attr('data-feather', function (d) { if (d) { return 'chevron-up' } else { return 'chevron-down'} })
	const rows = tbody.selectAll('tr')
		.data(data)
		.enter()
		.append('tr')
		.attr('id', function (row) {
			return row['ISO3Code']
		});
	const thead1 = thead.append('tr')
	const thead2 = thead.append('tr');
	const class_dict = {
		'': '',
		'Country': '',
		'ISO3Code': '',
		'ISO2Code': '',
		'Ground Truth Internet GG': 'table-primary',
		'Internet Online model prediction': 'table-primary',
		'Internet online model prediction': 'table-primary',
		'Internet Online-Offline model prediction': 'table-primary',
		'Internet Offline model prediction': 'table-primary',
		'Ground Truth Mobile GG': 'table-info',
		'Mobile_GG': 'table-info',
		'Mobile Online model prediction': 'table-info',
		'Mobile Online-Offline model prediction': 'table-info',
		'Mobile Offline model prediction': 'table-info',
	};
	const header_dict = {
		'': '#',
		'Country': 'Country',
		'ISO3Code': 'alpha-3',
		'ISO2Code': 'alpha-2',
		'Ground Truth Internet GG': 'ITU',
		'Internet Online model prediction': 'Online',
		'Internet online model prediction': 'Online',
		'Internet Online-Offline model prediction': 'Combined',
		'Internet Offline model prediction': 'Offline',
		'Ground Truth Mobile GG': 'Various',
		'Mobile_GG': 'Various',
		'Mobile Online model prediction': 'Online',
		'Mobile Online-Offline model prediction': 'Combined',
		'Mobile Offline model prediction': 'Offline',
	};

	function rowsort(d) {
		thead2.selectAll('th').attr('class', function (d) {
			return 'header ' + class_dict[d]
		}).text(function (d) {
			return header_dict[d]
		});

		if (sortAscending) {
			if ((d === 'Country') || (d === 'ISO3Code')) {
				rows.sort(function (a, b) {
					return d3.ascending(a[d], b[d]);
				});
			} else {
				rows.sort(function (a, b) {
					let ax = Number.parseFloat(a[d]);
					if (Number.isNaN(ax)) {
						ax = 0;
					}
					let bx = Number.parseFloat(b[d]);
					if (Number.isNaN(bx)) {
						bx = 0;
					}
					return d3.ascending(ax, bx);
				});
			}
			sortAscending = false;
			this.className = 'ascending ' + class_dict[d];
			//this.textContent = header_dict[d] + ' \u21E7';
		} else {
			if ((d === 'Country') || (d === 'ISO3Code')) {
				rows.sort(function (a, b) {
					return d3.descending(a[d], b[d]);
				});
			} else {
				rows.sort(function (a, b) {
					let ax = Number.parseFloat(a[d]);
					if (Number.isNaN(ax)) {
						ax = 0;
					}
					let bx = Number.parseFloat(b[d]);
					if (Number.isNaN(bx)) {
						bx = 0;
					}
					return d3.descending(ax, bx);
				});
			}
			sortAscending = true;
			this.className = 'descending ' + class_dict[d];
			//this.textContent = header_dict[d] + ' \u21E9';
		}
	}

	const header_dict2 = {
		'': '',
		'Country': 'Country',
		'ISO3Code': 'alpha-3',
		'ISO2Code': 'alpha-2',
		'Ground Truth Internet GG': 'ITU Internet GG',
		'Internet Online model prediction': 'Internet GG (Online Model Prediction)',
		'Internet online model prediction': 'Internet GG (Online Model Prediction)',
		'Internet Online-Offline model prediction': 'Internet GG (Online-Offline Prediction)',
		'Internet Offline model prediction': 'Internet GG (Offline Model Prediction)',
		'Ground Truth Mobile GG': 'Mobile GG',
		'Mobile_GG': 'Mobile GG',
		'Mobile Online model prediction': 'Mobile GG (Online Model Prediction)',
		'Mobile Online-Offline model prediction': 'Mobile GG (Online-Offline Prediction)',
		'Mobile Offline model prediction': 'Mobile GG (Offline Model Prediction)',
	};
	const header_dict3 = {
		'': '#',
		'Country': 'Country',
		'ISO3Code': 'alpha-3',
		'ISO2Code': 'alpha-2',
		'Ground Truth Internet GG': 'Internet GG - ITU',
		'Internet Online model prediction': 'Internet GG - Online',
		'Internet online model prediction': 'Internet GG - Online',
		'Internet Online-Offline model prediction': 'Internet GG - Combined',
		'Internet Offline model prediction': 'Internet GG - Offline',
		'Ground Truth Mobile GG': 'Mobile GG - Various',
		'Mobile_GG': 'Mobile GG - Various',
		'Mobile Online model prediction': 'Mobile GG - Online',
		'Mobile Online-Offline model prediction': 'Mobile GG - Combined',
		'Mobile Offline model prediction': 'Mobile GG - Offline',
	};

	thead1.attr('style', 'border-bottom: 0px;');
	thead1.append('th').attr('style', 'border-bottom: 0px;')
	thead1.append('th').attr('style', 'border-bottom: 0px;')
	thead1.append('th').attr('style', 'border-bottom: 0px;')
	thead1.append('th').attr('style', 'border-bottom: 0px;')
	const theadcell1 = thead1.append('th')
		.attr('colspan', '4')
		.attr('class', 'table-primary text-center')
		.attr('style', 'border-bottom: 0px;');
	theadcell1.append('a')
		.text('Internet GG')
		.attr('href', '/indicators#internet')
		.attr('class', 'mx-1')
	theadcell1.append('a')
		.text('?')
		.attr('class', 'badge badge-secondary')
		.attr('style', 'vertical-align: super;')
		.attr('href', '/indicators#internet')
	const theadcell2 = thead1.append('th')
		.attr('colspan', '4')
		.attr('class', 'table-info text-center')
		.attr('style', 'border-bottom: 0px;');
	theadcell2.append('a')
		.text('Mobile GG')
		.attr('href', '/indicators#mobile')
		.attr('class', 'mx-1')
	theadcell2.append('a')
		.text('?')
		.attr('class', 'badge badge-secondary')
		.attr('style', 'vertical-align: super;')
		.attr('href', '/indicators#mobile')

	thead2.selectAll('th')
		.data(columns)
		.enter()
		.append('th')
		.text(function (d) {
			return header_dict[d]
		})
		.attr('class', function (d) {
			if (d === '') {
				return 'ascending ' + class_dict[d]
			} else {
				return 'header ' + class_dict[d]
			}
		})
		.attr('style', 'border-top: 0px;')
		.on('click', rowsort)
	//.attr('class', 'row-anchor');
	rows.append('td')
		.append('img')
		.attr('class', 'flag shadow ')
		.attr('src', function (row) {
			return '/assets/images/flags/' + row['ISO2Code'].toLowerCase() + '.svg';
		})
		//.attr('height', '28px')
		.attr('width', '40px')

	//rows.selectAll('tr').append('a')

	const cells = rows.selectAll('td')
		.data(function (row) {
			return columns.map(function (column) {
				return {column: column, value: row[column]}
			})
		})
		.enter()
		.append('td')
		.attr('data-th', function (d) {
			return header_dict3[d.column];
		})
		.text(function (d) {
			return d.value
		});
	//.text(function (d) { if (d.column == 'ISO2Code') {return "<img src='/assets/images/flags/" + d.value + ".svg'/>"} else {return d.value }})
	//.append()
	//.attr('id', function (d) { if (d.column == 'ISO3Code') return d.value })

	//rows.selectAll('td[data-th=alpha-2]')
	//  .append('img')
	//  .attr('src', function (d) {
	//       return '/assets/images/flags/' + d.value + '.svg';
	//    })
	//  .attr('height', '28px').attr('width', '40px')

	d3.select('#' + mapName + '-table-shade').attr('class', 'd-none')
	//scrollToWindowHash()
	return table;
};

function raw_map(error, us) {
    if (error) throw error;
    // We need to colorize every country based on "numberOfWhatever"
    // colors should be uniq for every value.
    // For this purpose we create palette(using min/max series-value)
    //can we get the headers from the csv read func?
	let headers = [];
	//dataset.forEach(function(obj){ onlyValues.append(obj['numberOfThings']); });
    for (const key in csvdata[Object.keys(csvdata)[0]]) {
        if ((key !== "") && (key !== 'Country') && (key !== 'ISO3Code') && (key !== 'ISO2Code')) {
            headers.push(key);
        }
    }
    if (csvdata.USA.years) {
    	headers = Object.keys(csvdata.USA['2017']);
    }
	const selCol1 = document.getElementById(mapName + '-select-column');
	d3.select('#'+ mapName + '-select-column').selectAll('option').remove()

    for (const x in headers) {
	//	var header_dict5 = {
	//		'': '',
	//		'Country': 'Country',
	//		'ISO3Code': 'alpha-3',
	//		'Ground Truth Internet GG': 'Internet GG - ITU',
	//		'Internet online model prediction': 'Internet GG - Online',
	//		'Internet Online-Offline model prediction': 'Internet GG - Combined',
	//		'Internet Offline model prediction': 'Internet GG - Offline',
	//		'Mobile_GG': 'Mobile GG - GSMA',
	//		'Mobile Online model prediction': 'Mobile GG - Online',
	//		'Mobile Online-Offline model prediction': 'Mobile GG - Combined',
	//		'Mobile Offline model prediction': 'Mobile GG - Offline',
	//	};
        selCol1.options.add(new Option(headers[x], headers[x]));
    }
    selCol1.value = headers[0];
    d3.select('#'+ mapName + '-select-column').on('change', function() {    dggmap.setDataCapped(this.value);
                                                                            dggmap.updateColors();})

    dggmap.setDataCapped(selCol1.value);
    dggmap.updateColors();
    d3.select('#' + mapName + '-shade').attr('class', 'd-none')
    //tabulate(csvdatalist);

    //TODO get the datestring cleanly
    //var picker = document.getElementById(mapName + "-report-picker")
    //var report_title = picker.options[picker.selectedIndex].text
    //if (report_title == 'Latest') {
	//	report_title = picker.value.split('/')[1]
    //}
    //d3.select('#' + mapName + '-report-label').select('h2').text(report_title);
    //d3.select('#' + mapName + '-report-label').select('span').attr('class', 'd-none');
    d3.select('#' + mapName + '-csvlink').on("click", function() {location.href=csv_url;});
    //if (!window.location.search) {
	//	history.replaceState(null, '', '?report=' + report_title);
    //}
	//d3.select('#' + mapName + '-sharemail').on('click', function() {
	//	window.open("mailto:?to=&body=I'd%20like%20to%20share%20this%20Digital%20Gender%20Gaps%20report%20with%20you.%0A%0A" + window.location.href + "&subject=Digital%20Gender%20Gaps%20Report%20-%20" + report_title, '_blank');
	//})
	//addSearch()
}

function ready(error, us) {
    if (error) throw error;
    // We need to colorize every country based on "numberOfWhatever"
    // colors should be uniq for every value.
    // For this purpose we create palette(using min/max series-value)
    //can we get the headers from the csv read func?
	const headers = [];
	//dataset.forEach(function(obj){ onlyValues.append(obj['numberOfThings']); });
    for (const key in csvdata[Object.keys(csvdata)[0]]) {
        if ((key !== "") && (key !== 'Country') && (key !== 'ISO3Code') && (key !== 'ISO2Code')) {
            headers.push(key);
        }
    }
	const selCol1 = document.getElementById(mapName + '-select-column');
	d3.select('#'+ mapName + '-select-column').selectAll('option').remove()

    for (const x in headers) {
		const header_dict5 = {
			'': '',
			'Country': 'Country',
			'ISO3Code': 'alpha-3',
			'Ground Truth Internet GG': 'Internet GG - ITU',
			'Internet online model prediction': 'Internet GG - Online',
			'Internet Online model prediction': 'Internet GG - Online',
			'Internet Online-Offline model prediction': 'Internet GG - Combined',
			'Internet Offline model prediction': 'Internet GG - Offline',
			'Mobile_GG': 'Mobile GG - Various',
			'Ground Truth Mobile GG': 'Mobile GG - Various',
			'Mobile Online model prediction': 'Mobile GG - Online',
			'Mobile Online-Offline model prediction': 'Mobile GG - Combined',
			'Mobile Offline model prediction': 'Mobile GG - Offline',
		};
		selCol1.options.add(new Option(header_dict5[headers[x]], headers[x]));
    }
    selCol1.value = headers[1];
    d3.select('#'+ mapName + '-select-column').on('change', changeColumn)

    dggmap.setData(selCol1.value);
    dggmap.updateColors();
    d3.select('#' + mapName + '-shade').attr('class', 'd-none')
    tabulate(csvdatalist);

    //TODO get the datestring cleanly
	const picker = document.getElementById(mapName + "-report-picker");
	let report_title = picker.options[picker.selectedIndex].text;
	if (report_title === 'latest') {
		report_title = picker.value.split('/')[1]
    }
    d3.select('#' + mapName + '-report-label').select('h2').text(report_title);
    d3.select('#' + mapName + '-report-label').select('span').attr('class', 'd-none');
    d3.select('#' + mapName + '-data-link').on("click", function() {location.href=csv_url;});
	d3.select('#' + mapName + '-sharemail').on('click', function() {
		window.open("mailto:?to=&body=I'd%20like%20to%20share%20this%20Digital%20Gender%20Gaps%20report%20with%20you.%0A%0A" + window.location.href + "&subject=Digital%20Gender%20Gaps%20Report%20-%20" + report_title, '_blank');
	})
	addSearch()
}

function changeColumn() {
    dggmap.setData(this.value);
    dggmap.updateColors();
}

function addSearch() {
    d3.select('#' + mapName + '-table-filter')
      .on("keyup", function() {
		  let searched_data = csvdatalist,
			  text = this.value.trim();

		  let searchResults = searched_data.map(function (r) {
			  const regex = new RegExp("^" + text + ".*", "i");
			  if (regex.test(r.Country)) {
				  return regex.exec(r.Country)[0];
			  }
		  });

		  searchResults = searchResults.filter(function(r){
          return r !== undefined;
        })

        searched_data = searchResults.map(function(r) {
           return csvdatalist.filter(function(p) {
            return p.Country.indexOf(r) !== -1;
          })
        })

		searched_data = [].concat.apply([], searched_data)

		tabulate(searched_data)
		})
}

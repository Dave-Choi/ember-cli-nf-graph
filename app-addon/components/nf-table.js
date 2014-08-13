import Ember from 'ember';
import multiSort from '../utils/multi-sort';
import TableColumnRegistrar from '../mixins/table-column-registrar';
import parsePropExpr from '../utils/parse-property-expression';
import { SORT_NONE, SORTTYPE_SINGLE, SORTTYPE_MULTI } from '../utils/constants';

/**
	Composable table component with built-in sorting
	
	### Example

	      {{#nf-table rows=myData}}
	      	{{#nf-column sortField="foo"}}
	      	  {{nf-header}}
	      	  	Foo
	      	  {{/nf-header}}
	      	  {{#nf-cell}}
	      			{{row.foo}}
	      	  {{/nf-cell}}
	      	{{/nf-column}}
	      	{{#nf-column sortField="foo"}}
	      	  {{nf-header}}
	      	  	Bar
	      	  {{/nf-header}}
	      	  {{#nf-cell}}
	      			{{row.bar}}
	      	  {{/nf-cell}}
	      	{{/nf-column}}
	      {{/nf-table}}
	
	The example above will create a sortable table from an array `myData` containing objects
	with fields `foo` and `bar`.

	### Styling
	
	nf-table emits a `<table>` with a class of `nf-table` applied to it.


	@namespace components
	@class nf-table
	@extends Ember.Component
	@uses mixins.table-column-registrar
*/
export default Ember.Component.extend(TableColumnRegistrar, {
	tagName: 'table',

	/**
		Property used by child components to locate the table component.
		@property isTable
		@type Boolean
		@default true
	*/
	isTable: true,

	/**
		Gets the nf-table-group component if one is present.
		@property group
		@type components.nf-table-group
		@default null
	*/
	group: null,

	/**
		The expression used to locate the values in the rows to group by.
		@property groupBy
		@type String
		@default null
	*/
	groupBy: null,

	isStandardTable: Ember.computed.not('isGroupedTable'),

	isGroupedTable: Ember.computed.bool('group'),

	sortedGroups: function() {
		var sortMap = this.get('sortMap');
		var rows = this.get('rows');
		var groupBy = this.get('groupBy');
		if(!groupBy || !rows || rows.length === 0) {
			return null;
		}

		sortMap.unshift({
			by: groupBy,
			direction: 1
		});

		var rowsCopy = rows.slice();
		multiSort(rowsCopy, sortMap);

		var prevGroupVal;
		var group;
		var groupByExpr = parsePropExpr(groupBy);

		var groups = rowsCopy.reduce(function(groups, d) {
			var groupVal = groupByExpr(d) || null;

			if(groupVal !== prevGroupVal) {
				group = [];
				group.sortValue = groupVal;
				groups.push(group);
				prevGroupVal = groupVal;
			}

			group.push(d);
			return groups;
		}, []);

		return groups;
	}.property('rows.@each', 'sortMap', 'groupBy'),

	/**
		The data source for rows to display in this table.
		@property rows
		@default null
	*/
	rows: null,

	classNames: ['nf-table'],

	hasRendered: false,

	/**
		The type of sorting to do on the table. `'multi'` or `'single'`.
		@property sortType
		@type String
		@default 'single'
	*/
	sortType: SORTTYPE_SINGLE,


	_hasRendered: function() {
		this.set('hasRendered', true);
	}.on('willInsertElement'),

	sortMap: function(){
		return this.get('columns').filter(function(col) {
			return col.get('sortDirection') && col.get('sortBy');
		}).map(function(col) {
			return {
				by: col.get('sortBy').replace(/^row\./, ''),
				direction: col.get('sortDirection')
			};
		});
	}.property('columns.@each.sortDirection', 'columns.@each.sortBy'),

	/**
		A computed property returning a sorted copy of `rows`
		@property sortedRows
		@type Array
		@readonly
	*/
	sortedRows: function(){
		var sortMap = this.get('sortMap');
		var rowsCopy = this.get('rows').slice();
		multiSort(rowsCopy, sortMap);
		return rowsCopy;
	}.property('rows.@each', 'sortMap'),

	/**
		A computed alias returning the controller of the current view. Used to wire
		up child templates to the proper controller.
		@property parentController
		@type Ember.Controller
		@readonly
	*/
	parentController: Ember.computed.alias('templateData.view.controller'),

	actions: {

		/**
			Action handler to sort columns by a passed column. Sets the `sortDirection`
			of the pass column to the appropriate value based on the `sortType`.
			@method actions.sort
			@param sortedColumn {nf-column}
		*/
		sort: function(sortedColumn) {
			var columns = this.get('columns');
			var sortType = this.get('sortType');
			var currentSortDir = sortedColumn.get('sortDirection');

			if(sortType === SORTTYPE_SINGLE) {
				columns.forEach(function(col) {
					col.set('sortDirection', SORT_NONE);
				});
				sortedColumn.set('sortDirection', [1, 1, -1][currentSortDir + 1]);
			}

			if(sortType === SORTTYPE_MULTI) {
				sortedColumn.set('sortDirection', [0, 1, -1][currentSortDir + 1]);
			}
		}
	}
});
import Ember from 'ember';
import HasGraphParent from 'ember-cli-nf-graph/mixins/graph-has-graph-parent';
import DataGraphic from 'ember-cli-nf-graph/mixins/graph-data-graphic';
import RegisteredGraphic from 'ember-cli-nf-graph/mixins/graph-registered-graphic';
import parsePropExpr from 'ember-cli-nf-graph/utils/parse-property-expression';
import RequireScaleSource from 'ember-cli-nf-graph/mixins/graph-requires-scale-source';
import GraphicWithTrackingDot from 'ember-cli-nf-graph/mixins/graph-graphic-with-tracking-dot';
import { normalizeScale } from 'ember-cli-nf-graph/utils/nf/scale-utils';
import { getRectPath } from 'ember-cli-nf-graph/utils/nf/svg-dom';

/**
	Adds a bar graph to an `nf-graph` component.

	**Requires the graph has `xScaleType === 'ordinal'`***

	@namespace components
  @class nf-bars
  @extends Ember.Component
  @uses mixins.graph-has-graph-parent
  @uses mixins.graph-registered-graphic
  @uses mixins.graph-data-graphic
  @uses mixins.graph-requires-scale-source
*/
export default Ember.Component.extend(HasGraphParent, RegisteredGraphic, DataGraphic, RequireScaleSource, GraphicWithTrackingDot, {
	tagName: 'g',

	classNames: ['nf-bars'],

	/**
		The name of the property on each data item containing the className for the bar rectangle
		@property classprop
		@type String
		@default 'className'
	*/
	classprop: 'className',

	/**
		Gets the function to get the classname from each data item.
		@property getBarClass
		@readonly
		@private
	*/
	getBarClass: function() {
		var classprop = this.get('classprop');
		return classprop ? parsePropExpr(classprop) : null;
	}.property('classprop'),

	/**
		The nf-bars-group this belongs to, if any.
		@property group
		@type components.nf-bars-group
		@default null
	*/
	group: null,

	/**
		The index of this component within the group, if any.
		@property groupIndex
		@type Number
		@default null
	*/
	groupIndex: null,

	/**
		The graph content height
		@property graphHeight
		@type Number
		@readonly
	*/
	graphHeight: Ember.computed.oneWay('graph.graphHeight'),

	/**
		A scale provided by nf-bars-group to offset the bar rectangle output
		@property barScale
		@type d3.scale
		@readonly
	*/
	barScale: Ember.computed.oneWay('group.barScale'),

	/**
		The width of each bar.
		@property barWidth
		@type Number
		@readonly
	*/
	barWidth: function(){
		var barScale = this.get('barScale');
		if(barScale) {
			return barScale.rangeBand();
		}
		var xScale = this.get('xScale');
		return xScale && xScale.rangeBand ? xScale.rangeBand() : 0;
	}.property('xScale', 'barScale'),

	groupOffsetX: function(){
		var barScale = this.get('barScale');
		var groupIndex = this.get('groupIndex');
		return normalizeScale(barScale, groupIndex);
	}.property('barScale', 'groupIndex'),

	/**
		The bar models used to render the bars.
		@property bars
		@readonly
	*/
	bars: function(){
		var xScale = this.get('xScale');
		var yScale = this.get('yScale');
		var renderedData = this.get('renderedData');
		var graphHeight = this.get('graphHeight');
		var getBarClass = this.get('getBarClass');
		var groupOffsetX = this.get('groupOffsetX');

		if(!xScale || !yScale || !Ember.isArray(renderedData)) {
			return null;
		}

		var w = this.get('barWidth');

		return renderedData.map(function(d) {
			var barClass = 'nf-bars-bar' + getBarClass ? ' ' + getBarClass(d.data) : '';
			var x = normalizeScale(xScale, d[0]) + groupOffsetX;
			var y = normalizeScale(yScale, d[1]);
			var h = graphHeight - y;
			return {
				path: getRectPath(x, y, w, h),
				className: barClass,
				data: d,
			};
		});
	}.property('xScale', 'yScale', 'renderedData.[]', 'graphHeight', 'getBarClass', 'barWidth', 'groupOffsetX'),

	/**
		The name of the action to fire when a bar is clicked.
		@property barClick
		@type String
		@default null
	*/
	barClick: null,

	_registerBars: function(){
		var group = this.nearestWithProperty('isBarsGroup');
		if(group && group.registerBars) {
			group.registerBars(this);
		}
	}.on('init'),

	actions: {
		nfBarClickBar: function(dataPoint) {
			if(this.get('barClick')) {
				this.sendAction('barClick', {
					data: dataPoint.data,
					x: dataPoint[0],
					y: dataPoint[1],
					source: this,
					graph: this.get('graph'),
				});
			}
		}
	}

});
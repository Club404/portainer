angular
.module('portainer')
.directive('rdWidgetHeader', function rdWidgetTitle() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      title: '@',
      icon: '@',
      simple: '@'
    },
    transclude: true,
    template: '<div class="widget-header"><div class="row"><span ng-if="!simple" class="pull-left col-xs-2 col-sm-3 col-md-4"><i class="fa" ng-class="icon"></i> {{title}} </span><span class="{{ simple ? \'row\' : \'pull-right col-xs-10 col-sm-9 col-md-8\' }}" ng-transclude></span></div></div>',
    restrict: 'E'
  };
  return directive;
});

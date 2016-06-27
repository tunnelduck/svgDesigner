import AppController from './app.controller';
import {DesignRegionComponent} from './design-region.component'; 
import DesignRegionDirective from './design-region.directive'; 

(() => {
    angular.module('svgDesignerApp', [])
        .controller('appController', AppController)
        .component('designregion',
        {
            controller: DesignRegionComponent,
            template: `<design-region></design-region>`
        })
        .directive('designRegion', [DesignRegionDirective]);
})();


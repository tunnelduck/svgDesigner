import DesignRegionSvg from './svg/design-region-svg';

export default class DesignRegionDirective implements ng.IDirective {


    constructor() {
        return {
            template: ``,
            link(scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {

                var svg = new DesignRegionSvg(element);

            }
        };

    }

}
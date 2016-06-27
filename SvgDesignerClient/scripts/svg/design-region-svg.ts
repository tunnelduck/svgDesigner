import HandleDrawer from './handle-drawer';
import { Subject } from 'rxjs/Subject';

export default class DesignRegionSvg {

    private svg: Snap.Paper;

    private elementClicked = (element: Snap.Element, event: MouseEvent, onMove:Subject<any>) => {
        let handles = new HandleDrawer([element], this.svg, onMove);
    };

    private bindEvents = (set: Snap.Set) => {
        set.forEach((element: Snap.Element) => {
            let originalTransorm: string;
            let onMove = new Subject();
            element.drag(
                (dx: Number, dy: Number) => { //on move
                    element.attr({
                        transform: originalTransorm + (originalTransorm ? "T" : "t") + [dx, dy]
                    });
                    onMove.next({ dx: dx, dy: dy, originalTransorm: originalTransorm });
                },
                () => { //on start
                    originalTransorm = element.transform().local;
                },
                () => { //on stop
                
                }
            );

            element.mousedown((event: MouseEvent) => { this.elementClicked(element, event, onMove) });
        });
    }

    constructor(private svgElement: ng.IAugmentedJQuery) {
        this.svg = Snap("#svg");
        this.bindEvents(this.svg.selectAll('[class=element]'));
        this.svg.selectAll('[class=background]').forEach(function(element:Snap.Element) {
            element.mousedown((event: MouseEvent) => { console.log('background') });
        });
        console.log(angular.element(document.querySelector('#svg')));
        //angular.element(document.querySelector('#svg')).on("mousedown", function() { console.log("click") });
    }

}

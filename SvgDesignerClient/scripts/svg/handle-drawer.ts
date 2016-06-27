import Rect from './rect';
import { Subject } from 'rxjs/Subject';

export default class HandleDrawer {

    handles:any;

    private draw = (items: Array<any>) => {

        let bounds = this.getBounds(items);

        let topLeft = this.paper.rect(bounds.x - 5, bounds.y - 5, 10, 10);
        let bottomLeft = this.paper.rect(bounds.x - 5, bounds.y + bounds.height - 5, 10, 10);
        let topRight = this.paper.rect(bounds.x + bounds.width - 5, bounds.y - 5, 10, 10);
        let bottomRight = this.paper.rect(bounds.x + bounds.width - 5, bounds.y + bounds.height - 5, 10, 10);
        let topMiddle = this.paper.rect((bounds.x + (bounds.width / 2)) - 5, bounds.y - 5, 10, 10);
        let bottomMiddle = this.paper.rect((bounds.x + (bounds.width / 2)) - 5, bounds.y + bounds.height - 5, 10, 10);
        
        topLeft.mousedown((event) => { this.handleMouseDown(event, topLeft) });
        bottomLeft.mousedown((event) => { this.handleMouseDown(event, bottomLeft) });
        topRight.mousedown((event) => { this.handleMouseDown(event, topRight) });
        bottomRight.mousedown((event) => { this.handleMouseDown(event, bottomRight) });
        topMiddle.mousedown((event) => { this.handleMouseDown(event, topMiddle) });
        bottomMiddle.mousedown((event) => { this.handleMouseDown(event, bottomMiddle) });

        this.handles = this.paper.g(topLeft, bottomLeft, topRight, bottomRight, topMiddle, bottomMiddle);
    }

    private handleMouseDown = (event: MouseEvent, handle: Snap.Element) => {
        
    }

    private onParentDrag = (data: any) => {
        this.handles.attr({
            transform: data.originalTransorm + (data.originalTransorm ? "T" : "t") + [data.dx, data.dy]
        });
    }

    private getBounds = (items: Array<Snap.Element>) => {

        let minX: number = undefined;
        let minY: number = undefined;
        let maxX: number = undefined;
        let maxY: number = undefined;

        _.each(items, (item: Snap.Element) => {
            let bbox:Snap.BBox = item.getBBox();

            if (minX === undefined || bbox.x < minX) {
                minX = bbox.x;
            }

            if (maxX === undefined || bbox.x + bbox.width > maxX) {
                maxX = bbox.x + bbox.width;
            }

            if (minY === undefined || bbox.y < minY) {
                minY = bbox.y;
            }

            if (maxY === undefined || bbox.y + bbox.height > maxY) {
                maxY = bbox.y + bbox.height ;
            }
        });

        return new Rect(minX, minY, maxX - minX, maxY - minY);
    }; 

    constructor(items: Array<Snap.Element>, private paper: Snap.Paper, private onParentMove :Subject<any>) {

        this.draw(items);
        onParentMove.subscribe(this.onParentDrag);

    }
    
}
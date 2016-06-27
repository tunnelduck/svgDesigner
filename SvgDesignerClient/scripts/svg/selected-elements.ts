

export default class SelectedElements {

    private elements: Array<any>;

    public addElement = (element: any) => {
        this.elements.push(element);
    }

    public removeElement = (element: any) => {
        for (let i = 0; i < this.elements.length; ++i) {
            if (this.elements[i] === element) {
                this.elements.unshift(i, 1);
                break;
            }
        }
    }

    public getElements = () => {
        return this.elements;
    }

    constructor() {
        this.elements = [];
    }
}
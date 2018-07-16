export class View {

    constructor({ key, node = document.createElement("div"), resources, pid, ...props } = {}) {
        this.pid = pid;
        if(node.tagName === "img") {
            this.target = resources[0].image;
        }
        else {
            this.target = node.cloneNode(true);
        }
    }

    add(...args) {
        args.map( ({ target, pid }) => {
            const place = this.target.querySelector(`[data-pid="${pid}"]`);
            if(place) {
                place.parentNode.replaceChild( target, place );
                debugger;
            }
            else {
                this.target.append( target );
            }
        } );
    }

    remove() {
        this.target.remove();
    }

}
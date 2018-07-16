export class View {

    constructor({ key, node = document.createElement("div"), resources, pid, handlers, ...props } = {}, hook) {
        this.pid = pid;
        if(node.tagName === "img") {
            this.target = resources[0].image;
        }
        else {
            this.target = node.cloneNode(true);
        }
        handlers.map( ({ name, hn }) =>
            this.target.addEventListener(name, (e) => hn(e, { resources, pid, key, ...props}, hook), false)
        );
    }

    add(...args) {
        args.map( ({ target, pid }) => {
            const place = this.target.querySelector(`[data-pid="${pid}"]`);
            if(place) {
                place.parentNode.replaceChild( target, place );
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
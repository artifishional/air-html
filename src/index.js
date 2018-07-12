export class View {

    constructor({ key, node, resources, pid, ...props } = {}) {
        this.pid = pid;
        this.target = node;
    }

    add(...args) {
        this.target.appendChild(...args.map( ({ target }) => !target.parentNode && target ));
    }

    remove() {
        this.target.remove();
    }

}
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('before')) {
            return;
        }
        Object.defineProperty(item, 'before', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function before() {
                var argArr = Array.prototype.slice.call(arguments),
                    docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.parentNode.insertBefore(docFrag, this);
            }
        });
    });
})([
    Element.prototype,
    CharacterData.prototype,
    DocumentType.prototype
]);

const reg = /(\${\s*(argv|lang|intl)(?:\.?([a-zA-Z0-9\-_]+))?(?:,argv(?:\.([a-zA-Z0-9\-_]+))?)?\s*})/g;

function gtargeting(parent, res = []) {
    [...parent.childNodes].map(node => {
        if(node.nodeType === 3) {
            let last = 0;
            const nodes = [];
            node.wholeText.replace(reg, (_, all, type, name, param, pfx) => {

                if(Number.isInteger(name)) {
                    pfx = name;
                    name = "";
                    param = "";
                }
                else if(Number.isInteger(param)) {
                    pfx = param;
                    param = "";
                }

                param = param || "___default___";

                const text = new Text(node.wholeText.substring(last, pfx));
                const target = new Text(`\${${name}\}`);
                
                res.push({ name: name || "___default___", target, type, param });

                nodes.push(text, target);

                last = pfx + all.length;
            });

            if(nodes.length) {
                if(last !== node.wholeText.length) {
                    nodes.push(new Text(node.wholeText.substring(last)));
                }
                node.before(...nodes);
                node.remove();
            }
        }
        else if(node.nodeType === 1) {
            gtargeting(node, res);
        }
    });
    return res;
}

export class View {

    constructor({ key, node = document.createElement("div"), resources, pid, handlers = [], ...props } = {}, model) {
        this.pid = pid;
        this.key = key;

        let targeting = [];

        if(node.tagName === "img") {
            this.target = resources[0].image;
        }
        else {
            this.target = node.cloneNode(true);
            targeting = gtargeting(this.target);
        }
        this.props = { resources, pid, ...props, targeting };
        this.handlers = handlers;
        if(handlers.length) {
            if(!model) {
                throw "event processing requires an active model";
            }
            else {
                this.handler = model.at( () => {} );
                handlers.map( ({ name }) => this.target.addEventListener(name, this, false));
            }
        }
    }

    query(selector) {
        if(selector) {
            return this.target.querySelector(selector.replace(/\//g, "\\\/"));
        }
        else {
            return this.target;
        }
    }

    handleEvent(event) {
        this.handlers
            .find( ({ name }) => event.type === name )
            .hn(event, this.props, ({...args} = {}) => this.handler({ dissolve: false, ...args }), this.key);
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

    clear() {
        if(this.handler) {
            this.handlers.map( ({ name }) => this.target.removeEventListener(name, this, false));
            this.handler();
        }
    }

}
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

function gtemplate(str = "", ct = 0) {
    const len = str.length;
    let res = [];
    let srt = 0;
    let pfx = 0;
    let layer = 0;
    while (ct < len) {
        if(str[ct] === "{") {
            if(!layer) {
                if(pfx < ct) {
                    res.push( { type: "other", vl: str.substring(pfx, ct) } );
                }
                srt = ct;
            }
            layer ++ ;
        }
        if(str[ct] === "}") {
            if(layer > 0) {
                layer -- ;
            }
            if(!layer) {
                pfx = ct+1;
                res.push( { type: "template", vl: str.substring(srt, pfx) } );
            }
        }
        ct ++ ;
    }
    if(pfx < ct) {
        res.push( { type: "other", vl: str.substring(pfx, ct) } );
    }
    return res;
}

//const reg = /(\${\s*(argv|lang|intl)(?:\.?([a-zA-Z0-9\-_]+))?(?:,argv(?:\.([a-zA-Z0-9\-_]+))?)?\s*})/g;

function gtargeting(parent, res = []) {
    [...parent.childNodes].map(node => {
        if(node.nodeType === 3) {
            const nodes = gtemplate(node.nodeValue);
            const targeting = nodes.filter((type) => type === "template");
            res.push(...targeting);
            if(targeting.length) {
                node.before(...nodes.map(({vl}) => new Text(vl)));
                node.remove();
            }
        }
        else if(node.nodeType === 1) {
            gtargeting(node, res);
        }
    });
    return res;
}

function templater(vl, intl, argv, resources) {
    if(vl.indexOf("intl") === 4) {
        const [_, name, template] = vl.match(/^{intl.([a-zA-Z0-9_\-]+),(.*)}$/);
        const format = resources.find(({ type, name: x }) => type === "intl" && name === x);
        format.currency = format.currency || intl.currency;
        if(!isNaN(+template)) {
            const formatter = intl.NumberFormat(intl.locale, format);
            return formatter.format(+template);
        }
        else {
            const formatter = intl.NumberFormat(intl.locale, { currency: format.currency });
            const templates = gtemplate.map( ({ vl, type }) => {
                if(type === "template") {
                    return templater(vl, intl, argv, resources);
                }
                else {
                    return vl;
                }
            } );
            if(templates.some(x => x === null)) {
                return null;
            }
            return formatter.format(0).replace( "0", templates.join("") );
        }
    }
    else if(vl.indexOf("argv") === 4) {
        const [_, name = "__default__"] = vl.match(/^{argv(?:\.([a-zA-Z0-9_\-]+))?}$/);
        if(argv.hasOwnProperty(name)) {
            return argv.name;
        }
        else {
            return null;
        }
    }
    else if(vl.indexOf("lang") === 4) {
        const [_, name] = vl.match(/^{lang\.([a-zA-Z0-9_\-]+)}$/);
        return resources.find(({ type, name: x }) => type === "lang" && name === x);
    }
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

    setprops(argv, intl) {
        this.props.targeting.map( ({ vl, target }) => {
            const value = templater(vl, intl, argv, this.props.resources);
            value !== null && (target.nodeValue = value);
        } );
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
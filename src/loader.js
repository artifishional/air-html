import { stream } from "air-stream"

function transform( node ) {
    const m2data = JSON.parse(node.getAttribute("data-m2"));
    vertextes( node, m2data, m2data.type === "switch" );
    return m2data;
}

function vertextes(node, exist = [], cut) {
    return [...node.children].reduce( (acc, node) => {
        if(node.getAttribute("data-m2")) {
            cut && node.remove();
            acc.push( transform(node) );
        }
        else {
            vertextes(node, exist);
        }
        return acc;
    }, exist);
}

export default ({path: gpath = "m2units/"}) => ({source: {path}}) => stream( emt => {
    emt.kf();


    const xhr = new XMLHttpRequest();
    xhr.onload = () => {


        //превратить в json структуру
        const doc = new DOMParser()
            .parseFromString(xhr.response, "application/xml");


        emt(  );

    };
    xhr.open("get", gpath + path, true);
    xhr.send();





} );
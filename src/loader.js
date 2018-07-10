import { stream } from "air-stream"

export default ({path: gpath = "m2units/"}) => ({source: {path}}) => stream( emt => {
    emt.kf();


    const xhr = new XMLHttpRequest();
    xhr.onload = ( { readyState } ) => {


        //превратить в json структуру
        const doc = new DOMParser()
            .parseFromString(xhr.response, "application/xml")



        doc.evaluate("data-m2");




    };
    xhr.open("get", "yourFile.txt", true);
    xhr.send();




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

} );
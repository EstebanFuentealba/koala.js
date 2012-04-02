(function( jQuery ) {
    /* Default rest settings */
    jQuery.ajaxSetup({
        dataType: "json", 
        contentType: "application/json; charset=utf-8"
    });
    jQuery.koala.rest = {
        defauls: {
          verifyUrl: {
              "get": "{url}/(?{primary})",
              "post": "{url}",
              "put": "{url}/{primary}",
              "delete": "{url}/{primary}"
          }  
        },
        "get": function(url,params,callback){
            return jQuery.getJSON(url,params,callback);
        },
        "post": function(url,params,callback){
            return jQuery.ajax({
                type: 'POST',
                url: url, 
                data: params, 
                success: callback
            });
        },
        "put": function(url,params,callback){
            return jQuery.ajax({
                type: 'PUT', 
                url: url, 
                data: params, 
                success: callback
            });
        },
        "delete": function(options){
            return jQuery.ajax({
                type: 'DELETE',
                url: url,
                success: callback
            });
        }
    };
})(jQuery)
/*
 *  KoalaJS Plugin
 */
(function($){
    $.extend({
        koala: {
            debug: true,
            version : '0.0.2a',
            /*
             *  tipos de elemento soportados por KoalaJS
             */
            __typeElements : [
            "form",
            "combobox"
            ],
            /*
             *  Propiedades y funciones por defecto de un elemento KoalaJS (interface)
             */
            element : {
                allowAutoLoad: false,
                requirePrimary: false,
                utils: {
                    __setPrimary: function(ktype, selector,fieldName){}
                },
                processLoad:function(obj,record){},
                bindElement: function(obj){}
            },
            /*
             *  definiciones para combobox
             */
            combobox : {
                allowAutoLoad: true,
                
                utils: {
                    __setPrimary: function(ktype,selector, __primary) {},
                    __haveOptions : function(obj) {
                        return ($('option',$(obj)).length !== 0);
                    }
                },
                processLoad: function(records,options,paramsExtra){
                    if($.isArray(records)){
                        $.map(records,function(record){
                            $("<option value='"+record[options.option.value]+"'> "+record[options.option.display]+"</option>").appendTo($(options.selector));
                        })
                        options.callback(records,paramsExtra);
                    }
                    return false;
                },
        
                bindElement: function(opts){
                    $(opts).click(function(){
                        var me = this,
                        __koala         = $(me).data("koala")
                        defaults = {
                            callback: function(){}
                        };
                        var options = $.extend(defaults,__koala);
                        if(!$.koala.combobox.utils.__haveOptions(me)){
                            options.callback = function(){
                                $(me).trigger('click');
                            };
                            options.parameters = {
                                page: 1
                            };
                            $.koala.utils.loadData(options)
                        }
                    })
                }
            },
            /*
             *  función que inicializa los componentes de KoalaJS
             */
            init: function(opts){
                $.koala.log("init")
                if($.isArray(opts)){
                    $.map(opts,function(o){
                        $.koala.utils.__deploy(o);
                    })
                }else{
                    throw "Necesita un Array"
                }
            },
            /*
             * Utilidades de KoalaJS
             */
            utils: {
                /*
                 *  Verifica si un valor esta seteado o es indefinido
                 */
                isSet : function(value){
                    return (typeof(value) !== "undefined");
                },
                /*
                 *  Carga nuevos elementos definidos
                 */
                loadElements : function(elements){
                    $.map(elements,function(element){
                        var optionsElement = $.extend($.koala.element,element);
                        $.koala[optionsElement.ktype] = element;
                    });
                },
                /*
                 *  Llama al metodo 'processLoad' del componente KoalaJS y carga los datos a los elementos
                 *
                 */
                loadData : function(options,paramsExtra){
                    var fn = $.koala[options.ktype]["processLoad"],
                    defaults = {
                        callback: function(){}
                    };
                    options = $.extend(defaults,options),
                    source = $.koala.source.getInstance(options.source);
                    
                    source.load({
                        callback: function(records){
                            fn(records,options,paramsExtra)
                        }
                    },options);
                },
                __serializeArrayToObject: function(serializeArray) {
                    var tmp = {};
                    $.map(serializeArray,function(o){
                        tmp[o.name] = o.value;
                    });
                    return tmp;
                },
                __isChanged: function(record,values,field){
                    var isChanged = false,
                    sourceName;
                    if($.koala.utils.isSet(field)) {
                        return (record[field] != values[field]);
                    } else {
                        sourceName = record["__koala"]["__sourceName"];
                        $.map($.koala.source.getInstance(sourceName).getModel().options.fields,function(field){
                            if( ($.koala.utils.isSet(record[field.name]) && $.koala.utils.isSet(values[field.name])) && (record[field.name].toString() != values[field.name].toString()) ){
                                isChanged = true;
                            }
                        });
                        return isChanged;
                    }
                },
                __existsPrimary: function(record,values) {
                    if($.koala.utils.isSet(record)){
                        var model = $.koala.source.getInstance(record["__koala"]["__sourceName"]).getModel().options; 
                        return values[model["primary"]];
                    }
                    return false;
                },
                /*
                 *  Transforma los datos nativos del resultado json a los campos seteados en Model
                 */
                __parseJSON : function(json,root,model,source){
                    var jsonResult = eval("json."+root),
                    tmp = {};
                    if($.isArray(jsonResult)){
                        return $.map(jsonResult,function(o){
                            tmp = { };
                            tmp.__koala = {
                                '__sourceName': source
                            };
                            $.map($.koala.model.getInstance(model).options.fields,function(field){
                                tmp[field.name] = o[field.name];
                                return tmp;
                            });
                            return tmp;
                        });
                    } else {
                        throw "no esta bien definido 'root' en reader del source"
                    }
                },
                __deploy : function(opts){
                    
                    var defaults = { 
                        ktype: "form",
                        selector: null,
                        source: null
                    },
                    source,
                    model,
                    fn;
                    var options = $.extend(defaults,opts);
                    
                    if(options.selector == null) {
                        throw "Requiere un selector css la propiedad 'selector' "
                    }
                    if(options.source == null) {
                        throw "Requiere un 'source'"
                    }
                    
                    
                    if($.inArray(options.ktype, $.koala.__typeElements) >= 0){
                        $(options.selector).data("koala",options);
                        
                        source      = $.koala.source.getInstance(options.source),
                        model       = source.getModel();
                        
                        if(model.getOption("primary") != null){
                            var __primary = model.getOption("primary");
                            $.koala[options.ktype].utils.__setPrimary(options.ktype,options.selector, __primary)
                        }
                        if($.koala[options.ktype]["allowAutoLoad"] && source.options.autoLoad){
                            defaults = {
                                callback: function(){},
                                parameters: {
                                    page: 1
                                }
                            };
                            options = $.extend(defaults,options["callback"]);
                            $.koala.utils.loadData(options);
                        }
                        $.koala[options.ktype]["bindElement"]($(options.selector));
                        return true;
                    } else {
                        throw "Tipo de elemento no permitido por ahora en KoalaJS";
                    }
                }
            },
            model: (function() {                        
                var instances = {};
                function __constructor(modelName,opts) {
                    var me = this;
                    this.modelName = modelName;
                    this.options = opts;
                    this.getOption = function(key) {
                        return this.options[key];
                    };
                    this.getModel = function(){
                        return $.koala.model.getInstance(this.modelName);
                    };
                };
                return new function() {
                    this.getInstance = function(modelName,opts) {
                        if (instances[modelName] == null) {
                            instances[modelName] = new __constructor(modelName,opts);
                        }
                        return instances[modelName];
                    }
                }
            })(),
            source: (function() {                        
                var instances = {};
                function __constructor(sorceName,options) {
                    var me = this;
                    this.sourceName = sorceName;
                    
                    this.parameters = {
                        page: 0
                    };
                    this.currentParameters  = {
                        page: null,
                        nextPage: 0
                    };
                    
                    this.options = options;
                    this.storage = $.koala.storage.getInstance(sorceName);
                    this.load = function(opts,loadOptions) {
                        var me 	= this,
                        defaults = {
                            callback: function(){}
                        },
                        options = $.extend(defaults,opts),
                        storage = $.koala.storage.getInstance(me.sourceName);
                        if(me.parameters.page != loadOptions.parameters.page) {
                            me.parameters = loadOptions.parameters;
                            $.koala.rest.get(me.options.url,me.parameters,function(json){
                                me.currentParameters.page = me.parameters.page;
                                me.currentParameters.nextPage = (me.currentParameters.page +1)
                                
                                var results = $.koala.utils.__parseJSON(json,me.options.reader.root,me.options.model,me.sourceName);
                                
                                storage.addItem(me.options.reader.root,results);
                                options.callback(results)
                            });    
                        } else {
                            /*storage records*/
                            options.callback(storage.getItem(me.options.reader.root));
                        }
                        
                    };
                    this.requireLoad = function(){
                        return this.parameters != this.currentParameters.nextPage;
                    };
                    this.getModel = function(){
                        return $.koala.model.getInstance(this.options.model);
                    }
                    return this;
                }
                return new function() {
                    this.getInstance = function(sourceName,opts) {
                        if (instances[sourceName] === null) {
                            instances[sourceName] = new __constructor(sourceName,opts);
                        }
                        return instances[sourceName];
                    }
                }
            })(),
            define: {
                model: function(modelName,opts){
                    var defaults = {
                        primary: null,
                        fields:[]
                    },
                    options;
                    options = $.extend(defaults,opts);
                    if($.isArray(options.fields) && options.length == 0) {
                        throw "El modelo No tiene fields";
                    }
                    if(!$.isArray(options.fields)){
                        throw "la propiedad fields debe ser un array";
                    }
                    return $.koala.model.getInstance(modelName,options);
                },
                source: function(sorceName,opts){
                    
                    var defaults = {
                        model: null,
                        autoLoad: false,
                        autoSync: false,
                        pageSize: 10,
                        reader: {
                            root: null
                        },
                        url: null,
                        api: {
                            read: null,
                            write: null,
                            update: null,
                            remove: null
                        }
                    },
                    options;
                    options = $.extend(defaults,opts);
                    if(options.model == null) {
                        throw "no se definió un 'model' para la fuente de datos 'source'"
                    }
                    if(options.reader.root == null) {
                        throw "no se definio un 'root' para la propiedad 'reader' en la fuente de datos 'source'"
                    }
                    if(options.url == null) {
                        if(options.api.read == null) {
                            throw "no se definió ,mínimo, un link en la propiedad 'api.read'"
                        } else{
                            throw "no se definió la url"
                        }
                    }
                    return $.koala.source.getInstance(sorceName,options);
                    
                }
            },
            storage: (function(){
                var instances = {};
                function __constructor(sourceName) {
                    this.sourceName = sourceName;
                    this.data = {};
                    this.__allowLocalStorage = function(){
                        return $.koala.utils.isSet(window["localStorage"]);
                    };
                    this.__init = function(){
                        if (this.__allowLocalStorage()) {
                            localStorage[this.sourceName] = "{}";
                        } else {
                            this.data[this.sourceName] = {};
                        }
                    };
                    this.getAllData= function() {
                        if (this.__allowLocalStorage()) {
                            return $.evalJSON(localStorage.getItem(this.sourceName));
                        } else {
                            return this.data[this.sourceName];
                        }
                    };
                    this.getItem = function(key) {
                        var ds = this.getAllData();
                        return ds[key];
                    };
                    this.addItem = function(key,obj,options){
                        var ds = this.getAllData();
                        if($.isArray(ds[key])){
                            ds[key].push(obj);
                        } else{
                            ds[key] = obj;
                        }
                        if(this.__allowLocalStorage()){
                            localStorage.setItem(this.sourceName,$.toJSON(ds));
                        }else{
                            this.data[this.sourceName] = ds;
                        }
                    };
                    this.removeItem =function() {
                        if(this.__allowLocalStorage()){
                            localStorage.removeItem(this.sourceName);
                        }else{
                                    
                    }
                    };
                    this.removeAll = function() {
                        if(this.__allowLocalStorage()){
                            localStorage.clear();
                        } else{
                            this.data[this.sourceName] = [];
                        }
                    };
                    this.__init();
                }

                return new function() {
                    this.getInstance = function(sourceName) {
                        if (instances[sourceName] == null) {
                            instances[sourceName] = new __constructor(sourceName);
                        }
                        return instances[sourceName];
                    }
                }
            })(),
            log: function(value){
                if($.koala.debug){
                    console.log(value);
                }
            }
        }
    });
    $.fn.extend({
        getRecord: function(callback) {
            return $(this).each(function(){
                var me = this,
                record = $(me).data("koalaRecord");
                callback( ($.koala.utils.isSet(record) ) ? record : null );
            });
        }, 
        loadRecord: function(record) {
            return $(this).each(function(){
                $.koala.form.processLoad(this,record);
            });
        }
    })

})(jQuery);

$(function(){
    $.koala.utils.loadElements([
    {
        ktype: "form",
        allowAutoLoad: false,
        utils: {
            __setPrimary: function(ktype, selector,fieldName){
                if($("input[name='"+fieldName+"']",$(selector)).length == 0){
                    $(selector).append($("<input type='hidden' name='"+fieldName+"' />"))
                }
            }
        },
        processLoad:function(obj,record,paramsExtra){
            var me          = obj,
            sourceName   = record["__koala"]["__sourceName"],
            source      = $.koala.source.getInstance(sourceName),
            model       = source.getModel(),
            input,
            select,
            __koala;
                
            var __primary = model.options["primary"];
            
            if($.koala.utils.isSet(__primary)){
                if($("input[name='"+__primary+"']",$(me)).length == 0){
                    $(me).append($("<input type='hidden' name='"+__primary+"' />"))
                }
            }
            
            $(me).data("koalaRecord",record);
            
            for (var fieldName in record) {
                
                select = $('select[name="'+fieldName+'"]',$(me));
                input = $('input[name="'+fieldName+'"]',$(me));
                
                if(input.length>0){
                    input.val(record[fieldName]);
                } else if(select.length>0){
                    
                    __koala = $(select).data("koala");
                    
                    if($.koala.utils.isSet(__koala)){
                        var cmb = $(__koala.selector),defaults = {
                            callback: function(){}
                        };
                        var options = $.extend(defaults,__koala);
                        if(!$.koala.combobox.utils.__haveOptions(cmb)){
                            var value = record[fieldName];
                            options.callback = function(json,paramsExtra){
                                $(paramsExtra[0]).trigger('click');
                                $(paramsExtra[0]).val(paramsExtra[1])
                            };
                            options.parameters= {
                                page: 1
                            };
                            $.koala.utils.loadData(options,[cmb,value])
                        } else {
                            select.val(record[fieldName]); 
                        }
                    } else {
                                    
                        select.val(record[fieldName]); 
                    }
                }
            }
        },
        bindElement: function(obj){
            console.log("BIND ELEMENT")
            $(obj).bind("submit", function(e) {
                var me              = this,
                __koala         = $(me).data("koala"),
                source          = $.koala.source.getInstance(__koala["source"]),
                record          = $(me).data("koalaRecord"),
                tmpValues       = $.koala.utils.__serializeArrayToObject($(me).serializeArray());
                
                //UPDATE
                if($.koala.utils.isSet(record)){
                    var existPrimary    = $.koala.utils.__existsPrimary(record ,tmpValues);
                    if(existPrimary){
                        if($.koala.utils.__isChanged(record,tmpValues)){
                            $.koala.rest.put(source.options.url+"/"+existPrimary,$.toJSON(tmpValues),function(json){
                                $.extend(record,tmpValues);
                            //console.log("success");
                            }).success(function() {
                                //console.log("second success"); 
                                })
                            .error(function() { 
                                //console.log("error"); 
                                })
                            .complete(function() { 
                                //console.log("complete"); 
                                });
                            
                        //console.log("UPDATE");
                        }
                    }
                } else {
                    // CREATE
                    $.koala.rest.post(source.options.url,$.toJSON(tmpValues),function(json){
                        //console.log("success");
                        }).success(function() { 
                        //console.log("second success"); 
                        })
                    .error(function() { 
                        //console.log("error"); 
                        })
                    .complete(function() { 
                        //console.log("complete"); 
                        });
                }
                
                return false;
            }).bind("reset", function() {
                var me = this;
                $.removeData(me,"koalaRecord");
            })
        }
    }
    ]);
})
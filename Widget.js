define([
    'dojo/_base/declare',
    "dojo/dom-construct",
    'jimu/BaseWidget',
    "dojox/xml/parser",
    "dojo/store/Memory",
    "dijit/form/ComboBox",
    "dijit/form/TextBox",
    "dijit/form/FilteringSelect",
    'dijit/form/Button',
    'dojo/dom',
    'dojo/on',
    "dojo/query",   
    "esri/request",
    "esri/config",
    "esri/graphic",
    "esri/symbols/PictureMarkerSymbol",
    'esri/geometry/Point',
    "esri/Color",
    "esri/SpatialReference",
    "esri/geometry/webMercatorUtils",
    'dojo/_base/lang'
  ],
  function(
    declare,domConstruct, BaseWidget, xmlParser, Memory,ComboBox,TextBox,FilteringSelect,Button, dom, on, query,esriRequest, esriConfig, Graphic,
    PictureMarkerSymbol, Point, Color, SpatialReference, webMercatorUtils, lang) {
    return declare([BaseWidget], {
      baseClass: 'jimu-widget-zoomTo',
      name: 'Referencia Catastral',
      symbol: null,
      RC: null,
      direcc_google: null,
      
      postCreate: function() {
        this.inherited(arguments);
        this.symbol = new PictureMarkerSymbol('http://static.arcgis.com/images/Symbols/Basic/YellowStickpin.png', 51, 51);
        this.provincias_name
        this.muni_name
      },

     onOpen: function() {
        
        
        //servicio Catastro busqueda de provincias
        var url_prov= "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaProvincia";
        var consult_prov = esriRequest({
          "url": url_prov,
          "handleAs": "xml"
        }).then(lang.hitch(this, function(response) {
          dom.byId("status").value = xmlParser.innerXML(response);
          var respuesta = dom.byId("status").value;
          var resp_prov_name = response.getElementsByTagName('np');
          
          //creo array vacio. el objetivo es crear el objeto con las propiedades name y values 
          var provincias_name = [];     
          //hago loop por resp_prov_name values       
          var i;
          for (i=0; i< resp_prov_name.length; i++){

            //busca nombre provincia
              dom.byId("status").value = xmlParser.textContent(resp_prov_name[i]);
              var resp_prov_name1 = dom.byId("status");
              this.resp_prov_name1=resp_prov_name1.value;
          //dentro del loop paso los valores de provincias con push a provincias_name, dentro del array     
              provincias_name.push({name:this.resp_prov_name1, value:this.resp_prov_name1});
                                                                         
          };
         
                     
          //paso datos para completar el combobox de provincias  
          var comboBox = new ComboBox({
              
              id: "provinciasName",
              name: "provincias_name",
              value: "Elija provincia",
              store: new Memory({ data: provincias_name }),
          //cuando el combo de provincias cambie, se extrae el nombre de provincia y se hace el reques al municipio   
              onChange: function(prov_select){
                var prov = this.item.name;
                console.log("la provincia es " + this.item.name);
          //servicio Catastro busqueda de municipios      
                var url_muni= "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaMunicipio?Provincia="+prov+"&Municipio=";
                var consult_muni = esriRequest({  
                  "url": url_muni,
                  "handleAs": "xml"
                }).then(lang.hitch(this,function(response){
                    dom.byId("status").value = xmlParser.innerXML(response);
                    var respuesta = dom.byId("status").value;
                    var resp_muni_name = response.getElementsByTagName('nm');
                    var muni_name = []
                    //hago loop por resp_muni_name values (LOOP PARA municipios)      
                    var i;
                    for (i=0; i< resp_muni_name.length; i++){

                     //Saco los nombres de los municipios
                        dom.byId("status").value = xmlParser.textContent(resp_muni_name[i]);
                        var resp_muni_name1 = dom.byId("status");
                        this.resp_muni_name1=resp_muni_name1.value;

                    //dentro del loop paso los nombres de municipios con push a muni_name, dentro del array     
                        muni_name.push({name:this.resp_muni_name1, value:this.resp_muni_name1});
                        //this.muni_name = muni_name
                                                                                   
                    };
                   this.muni_name = muni_name

                   console.log("numero de municipios encontrados " + this.muni_name.length)
                }));// end EsriRequest
                
                  
              }//end OnChange Provincias
          },"stateSelect").startup(); //end ComboBox Provincias

          new dijit.form.FilteringSelect({
              id: "MuniNameName",
              store: new Memory({ data: this.muni_name }),
              autoComplete: true,
              value: "Elija municipio",
              style: "width: 150px;",
              onChange: function(state){
                 dijit.byId('provinciasName').query.state = this.item.state || /.*/;
              }
          }, "stateSelect2").startup();

          }));// end Response

      /*var stateStore2 = new Memory({
                    //se asigna como dato muni_name    
                        data: this.muni_name

                    });
                    console.log("el stateStore2 es  " + stateStore2)            
                    //paso datos para completar el combobox  
                    var comboBox2 = new ComboBox({
                        
                        id: "MuniNameName",
                        name: "municipio_name",
                        value: "Elija municipio",
                        store: stateStore2,
                                                                                     
                    },"stateSelect2").startup(); */
        //limpio campos una vez que se cierra el widget-----ESTAN DENTRO DEL FORM, POSIBLEMENTE LO BORRE.
        
        dom.byId("CoordX").innerHTML = ""
        dom.byId("CoordY").innerHTML = ""
        dom.byId("RC").innerHTML = ""
        dom.byId("dir").innerHTML = ""
        dom.byId("error").innerHTML = ""
      },




     


      onZoomClick: function() {
        //llamando al proxy---descomentar cuando esté en el servidor
        //esriConfig.defaults.io.proxyUrl = "PHP/proxy.php?";

        this.RC = dom.byId("RC").value.substring(0, 14);
        var url = "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?Provincia=&Municipio=&SRS=EPSG%3A4326&RC=" + this.RC
        if (this.RC == "") {
          var prov = dom.byId("prov").value;
          var mun = dom.byId("muni").value;
          var pol = dom.byId("pol").value;
          var parc = dom.byId("parc").value;
          url = "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPPP?Provincia=" + prov + "&Municipio=" + mun + "&Poligono=" + pol + "&Parcela=" + parc
          
        }

        var requestHandle = esriRequest({
          "url": url,
          "handleAs": "xml"
          //para evitar problemas de scope al usar el this hay que usar lang
        }).then(lang.hitch(this, function(response) {
          dom.byId("status").value = xmlParser.innerXML(response);
          var respuesta = dom.byId("status").value;
          
          if (this.RC != "") {
            var xcen = response.getElementsByTagName('xcen');
            var ycen = response.getElementsByTagName('ycen');
            var dir = response.getElementsByTagName('ldt');
            var error = response.getElementsByTagName('des');

            if (xcen.length == 0) {
              dom.byId("error").value = xmlParser.textContent(error[0]);
              var errores = dom.byId("error");
              dom.byId("error").innerHTML = "La Sede Electrónica del Catastro devuelve el siguiente mensaje: <br><br>" + errores.value;
              dom.byId("CoordX").innerHTML = "";
              dom.byId("CoordY").innerHTML = "";
              dom.byId("RC").innerHTML = "";
              dom.byId("dir").innerHTML = "";
            } else {
              dom.byId("CoordX").value = xmlParser.textContent(xcen[0]);
              var coordX = dom.byId("CoordX");
              //dom.byId("CoordX").innerHTML = coordX.value;
              dom.byId("CoordY").value = xmlParser.textContent(ycen[0]);
              var coordY = dom.byId("CoordY");
              //dom.byId("CoordY").innerHTML = coordY.value;
              dom.byId("error").innerHTML = "";

              //direccion
              dom.byId("dir").value = xmlParser.textContent(dir[0]);
              var dir = dom.byId("dir");
              dom.byId("dir").innerHTML = "La dirección es: <br>" + dir.value;

              //creo y añado un punto
              var punto = new Point(coordX.value, coordY.value, new SpatialReference({
                wkid: 4326
              }));
              var geom = webMercatorUtils.geographicToWebMercator(punto); // project the point to webmercator since that is what esri basmaps are
              var graphic = new Graphic(geom, this.symbol);
              this.map.graphics.add(graphic);
              this.map.centerAndZoom(punto, 20); //esri basemaps are tiled so the level is a value like 12 Not 100
              //genera dirección a Google

              dir_g = "https://www.google.com/maps/place/@"+coordX+","+coordY+",20z";
              this.direcc_google = dir_g;
              console.log(this.direccion_google)
              //dom.byId("dir_google").innerHTML = dir_g.value;
            }
          } else {
            var pc_1 = response.getElementsByTagName('pc1');
            dom.byId("pc1").value = xmlParser.textContent(pc_1[0]);
            var pc1 = dom.byId("pc1").value;
            console.log(pc1)

            var pc_2 = response.getElementsByTagName('pc2');
            dom.byId("pc2").value = xmlParser.textContent(pc_2[0]);
            var pc2 = dom.byId("pc2").value;
            console.log(pc2)

            this.RC = pc1 + pc2;
            console.log("La referencia catastral es " + this.RC)
            
              //repeat code
            var url = "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?Provincia=&Municipio=&SRS=EPSG%3A4326&RC=" + this.RC
            var requestHandle = esriRequest({
            "url": url,
            "handleAs": "xml"
            //para evitar problemas de scope al usar el this hay que usar lang
      }).then(lang.hitch(this,function(response){
          dom.byId("status").value = xmlParser.innerXML(response);
          var respuesta = dom.byId("status").value;
                           
          
          var xcen = response.getElementsByTagName('xcen');
          var ycen = response.getElementsByTagName('ycen');
          var dir = response.getElementsByTagName('ldt');
          var error = response.getElementsByTagName('des');
          

          if (xcen.length==0) {
            dom.byId("error").value = xmlParser.textContent(error[0]);
            var errores = dom.byId("error");
            dom.byId("error").innerHTML = errores.value;
            dom.byId("CoordX").innerHTML = ""
            dom.byId("CoordY").innerHTML = ""
            dom.byId("RC").innerHTML = ""
            dom.byId("dir").innerHTML = "" 


          } else {
            dom.byId("CoordX").value = xmlParser.textContent(xcen[0]);
            var coordX = dom.byId("CoordX");
            console.log(coordX)
            //dom.byId("CoordX").innerHTML = coordX.value;
            dom.byId("CoordY").value = xmlParser.textContent(ycen[0]);
            var coordY = dom.byId("CoordY");
            //dom.byId("CoordY").innerHTML = coordY.value;
            dom.byId("error").innerHTML = ""

            //direccion
            dom.byId("dir").value = xmlParser.textContent(dir[0]);
            var dir = dom.byId("dir");
            dom.byId("dir").innerHTML = "La dirección es: <br>" + dir.value;

            //creo y añado un punto
            var punto = new Point(coordX.value, coordY.value, new SpatialReference({wkid:4326}));
            var geom = webMercatorUtils.geographicToWebMercator(punto); // project the point to webmercator since that is what esri basmaps are
            var graphic = new Graphic(geom, this.symbol);
            this.map.graphics.add(graphic);
            this.map.centerAndZoom(punto, 18); //esri basemaps are tiled so the level is a value like 12 Not 100
            
            }                             
       }));

              //end code


          }
        }));
      },

      onClose: function() {
        this.map.on("click", function() {
          console.log("click_close");
        });
        this.map.graphics.clear();
      }
    });
  });
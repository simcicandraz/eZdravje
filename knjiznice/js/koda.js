
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
  var ehrId = "";
  var dodatek;
  switch(stPacienta) {
    case 1:
      kreirajEHRgen("Janez", "Novak", "1962-10-19T08:30Z", "180", "187", "110", stPacienta);
      break;
    case 2:
      kreirajEHRgen("Mitja", "Kvas", "1980-06-08T09:30Z", "160", "150", "85", stPacienta);
      break;
    case 3:
      kreirajEHRgen("Živa", "Groza", "1979-12-06T11:30Z", "156", "130", "75", stPacienta);
      break;
  }
  return ehrId;
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija

function kreirajEHRgen(ime, priimek, datumRojstva, visina, zacetnaTeza, ciljnaTeza, stPacienta) {
	sessionId = getSessionId();

  var dodatek;
	
	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	$.ajax({
	    url: baseUrl + "/ehr",
	    type: 'POST',
	    success: function (data) {
	        var ehrId = data.ehrId;
	        var partyData = {
	            firstNames: ime,
	            lastNames: priimek,
	            dateOfBirth: datumRojstva,
	            partyAdditionalInfo: [{key: "ehrId", value: ehrId},
	            {key: "height", value: visina},
	            {key: "currWeigth", value: zacetnaTeza},
	            {key: "goalWeight", value: ciljnaTeza}
	            ]
	        };
	        $.ajax({
	            url: baseUrl + "/demographics/party",
	            type: 'POST',
	            contentType: 'application/json',
	            data: JSON.stringify(partyData),
	            success: function (party) {
	                if (party.action == 'CREATE') {
	                    dodatek = "<option value='"+ehrId+"||"+"'>"+ ehrId +"</option></select>";
                      $("#preberiObstojeciVitalniZnak").append(dodatek);
                      dodatek = "<option value='"+ehrId+"'>"+ ehrId +"</option></select>";
                      $("#preberiObstojeciEHR").append(dodatek);
                      switch(stPacienta) {
                        case 1:
                          dodajMeritevTezeGen(ehrId, "2016-01-01T10:10Z", "170");
                          dodajMeritevTezeGen(ehrId, "2016-02-01T10:10Z", "155");
                          dodajMeritevTezeGen(ehrId, "2016-03-01T10:10Z", "112");
                          break;
                        case 2:
                          dodajMeritevTezeGen(ehrId, "2016-01-01T10:10Z", "141");
                          dodajMeritevTezeGen(ehrId, "2016-02-01T10:10Z", "117");
                          dodajMeritevTezeGen(ehrId, "2016-03-01T10:10Z", "101");
                          break;
                        case 3:
                          dodajMeritevTezeGen(ehrId, "2016-01-01T10:10Z", "109");
                          dodajMeritevTezeGen(ehrId, "2016-02-01T10:10Z", "88");
                          dodajMeritevTezeGen(ehrId, "2016-03-01T10:10Z", "75");
                          break;
                      }
	                }
	            },
	            error: function(err) {
	            	console.log("Error");
	            }
	        });
	    }
	});
}

function dodajMeritevTezeGen(ehrId, datumInUra, telesnaTeza) {
	sessionId = getSessionId();

	$.ajaxSetup({
	    headers: {"Ehr-Session": sessionId}
	});
	var podatki = {
	    "ctx/language": "en",
	    "ctx/territory": "SI",
	    "ctx/time": datumInUra,
	    "vital_signs/body_weight/any_event/body_weight": telesnaTeza
	};
	var parametriZahteve = {
	    ehrId: ehrId,
	    templateId: 'Vital Signs',
	    format: 'FLAT',
	};
	$.ajax({
	    url: baseUrl + "/composition?" + $.param(parametriZahteve),
	    type: 'POST',
	    contentType: 'application/json',
	    data: JSON.stringify(podatki),
	    success: function (res) {
	        
	    },
	    error: function(err) {
	    	console.log("Napaka pri dodajanju meritev teze.")
	    }
	});
}


function kreirajEHR() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();
	var visina = $("#kreirajVisina").val();
	var zacetnaTeza = $("#kreirajZacetnaTeza").val();
	var ciljnaTeza = $("#kreirajCiljnaTeza").val();

	if (!ime || !priimek || !datumRojstva || !visina || !zacetnaTeza || !ciljnaTeza || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0 || visina.trim().length == 0 || zacetnaTeza.trim().length == 0 || ciljnaTeza.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Niste vpisali vseh zahtevanih podatkov!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId},
		            {key: "height", value: visina},
		            {key: "currWeigth", value: zacetnaTeza},
		            {key: "goalWeight", value: ciljnaTeza}
		            ]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Registracija uspešna '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka pri registraciji'" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}

function dodajMeritevTeze() {
	sessionId = getSessionId();

	var ehrId = $("#dodajMeritevEHR").val();
	var datumInUra = $("#dodajMeritevDatumInUra").val();
	var telesnaTeza = $("#dodajMeritevTeza").val();

	if (!ehrId || !datumInUra || !telesnaTeza || ehrId.trim().length == 0 || datumInUra.trim().length == 0 || telesnaTeza.trim().length == 0) {
		$("#dodajMeritevTezeSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Niste vpisali vseh zahtevanih podatkov!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritevTezeSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritevTezeSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}

function preberiEHR() {
	sessionId = getSessionId();
  
  var zacetnaTeza, ciljnaTeza;
	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				for (i in party.partyAdditionalInfo) {
			    if (party.partyAdditionalInfo[i].key == "goalWeight") {
			       ciljnaTeza = party.partyAdditionalInfo[i].value;
			    }
			    if (party.partyAdditionalInfo[i].key == "currWeigth") {
			       zacetnaTeza = party.partyAdditionalInfo[i].value;
			    }
  			}
				$("#rezultatMeritev").html("<br/><span>Pridobivanje " +
          "podatkov za osebo <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><span> Teža ob prijavi: <b>" + zacetnaTeza + "</b> kg. Želena teža: <b>" + ciljnaTeza + "</b> kg.</span><br/><br/>");
				$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
				    type: 'GET',
				    headers: {"Ehr-Session": sessionId},
				    success: function (res) {
				    	if (res.length > 0) {
					    	var results = "<table class='table table-striped " +
                  "table-hover'><tr><th>Datum in ura</th>" +
                  "<th class='text-right'>Telesna teža</th></tr>";
					        for (var i in res) {
					            results += "<tr><td>" + res[i].time +
                        "</td><td class='text-right'>" + res[i].weight +
                        " " + res[i].unit + "</td>";
					        }
					        results += "</table>";
					        $("#rezultatMeritev").append(results);
				    	} else {
				    		$("#preberiSporocilo").html(
                  "<span class='obvestilo label label-warning fade-in'>" +
                  "Ni podatkov!</span>");
				    	}
				    },
				    error: function() {
				    	$("#preberiSporocilo").html(
                "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                JSON.parse(err.responseText).userMessage + "'!");
				    }
				});
	    	},
	    	error: function(err) {
	    		$("#preberiSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
	    	}
		});
	}
}

$(document).ready(function() {

  /*$('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val().split("|");
    $("#kreirajIme").val(podatki[0]);
    $("#kreirajPriimek").val(podatki[1]);
    $("#kreirajDatumRojstva").val(podatki[2]);
    $("#kreirajVisina").val(podatki[3]);
    $("#kreirajZacetnaTeza").val(podatki[4]);
    $("#kreirajCiljnaTeza").val(podatki[5]);
  });*/
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajMeritevEHR").val(podatki[0]);
		$("#dodajMeritevDatumInUra").val(podatki[1]);
		$("#dodajMeritevTeza").val(podatki[2]);
	});
	
	$("#personGen").click(function() {
	  generirajPodatke(1);
	  generirajPodatke(2);
	  generirajPodatke(3);
	})

});

function pridobiProcent() {
  sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();
	var ciljnaTeza = 0;
	var zacetnaTeza = 0;;
	var latestWeight;
	var prevDate, currDate;
	var procent;

	if (ehrId || ehrId.trim().length != 0) {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				  var party = data.party;
				  
				    for (i in party.partyAdditionalInfo) {
  				    if (party.partyAdditionalInfo[i].key == "goalWeight") {
  				       ciljnaTeza = party.partyAdditionalInfo[i].value;
  				    }
  				    if (party.partyAdditionalInfo[i].key == "currWeigth") {
  				       zacetnaTeza = party.partyAdditionalInfo[i].value;
  				    }
  				  }
  				  //console.log(ciljnaTeza);
  				  
  				  $.ajax({
        		  url: baseUrl + "/view/" + ehrId + "/" + "weight",
        	    type: 'GET',
        	    headers: {"Ehr-Session": sessionId},
        	    success: function (res) {
        	    	if (res.length > 0) {
        	    	  prevDate = new Date("1900-01-01T01:01Z")
        	        for (var i in res) {
        	          currDate = new Date(res[i].time);
        	          if (currDate > prevDate) {
        	            prevDate = currDate;
        	            latestWeight = res[i].weight;
        	          }
        	        }
        	        //console.log(ciljnaTeza);
        	        //console.log(latestWeight);
        	        
        	        if ((latestWeight-ciljnaTeza) <= 0) {
                	  procent = 100;
                	} else {
                	  procent = 100-((latestWeight-ciljnaTeza)*100/(zacetnaTeza-ciljnaTeza));
                	}
                	console.log(procent);
                	
                	$("#fillgauge1").remove();
                	var results = "<svg id='fillgauge1' width='97%' height='250'></svg>";
                	$("#gaugeParent").append(results);
                	
                	var gauge1 = loadLiquidFillGauge("fillgauge1", procent);
                	
        	    	} 
        	    },
        	    error: function() {
        	      console.log("Error")
        	    }
        	});
  				  
	    	},
	    	error: function(err) {
	    		console.log("Error on getting latest date weight")
	    	}
		});
	}
}

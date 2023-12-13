// SaaS95 Copyright © 2023 by Caleb Stephens

var starting_difference = 0;
var reconciled_difference = 0;
var unreconciled_difference = 0;
var open_period;
var close_period;
var account_id;
var elnames = [];
var select_options;
var cfels;
var stbd;
var etbd;
var please_wait;
var introjs_page = '';
var note_caption;
var note_modal;
var recons;
var formData;

$(document).ready(function(){
	$( ".datepicker" ).datepicker({ dateFormat: 'yy-mm-dd' });
	$(".dropdown-toggle").dropdown();

	commify_all();

	var template = $('#please-wait').html();
	Mustache.parse(template);   
	please_wait = Mustache.render(template);

	if(getCookie('introjs') !== "1")
	{
		introjs_init();
	}

	ddsmoothmenu.init({
		mainmenuid: "smoothmenu1", //menu DIV id
		orientation: 'h', //Horizontal or vertical menu: Set to "h" or "v"
		classname: 'ddsmoothmenu', //class added to menu's outer DIV
		//customtheme: ["#1c5a80", "#18374a"],
		contentsource: "markup" //"markup" or ["container_id", "path_to_menu_file"]
	});

	ddsmoothmenu.init({
		mainmenuid: "smoothmenu2", //Menu DIV id
		orientation: 'v', //Horizontal or vertical menu: Set to "h" or "v"
		classname: 'ddsmoothmenu-v', //class added to menu's outer DIV
		method: 'toggle', // set to 'hover' (default) or 'toggle'
		arrowswap: true, // enable rollover effect on menu arrow images?
		//customtheme: ["#804000", "#482400"],
		contentsource: "markup" //"markup" or ["container_id", "path_to_menu_file"]
	});

	reset_home();


});

var stop_introjs = 0;


function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
	  let c = ca[i];
	  while (c.charAt(0) == ' ') {
		c = c.substring(1);
	  }
	  if (c.indexOf(name) == 0) {
		return c.substring(name.length, c.length);
	  }
	}
	return "";
}

function populate_detail(id, open, close)
{
	console.log("opener");
	do_post('server',{'p':'gcd', 'id': id, 'open_period': open, 'close_period': close}, function(data) {
		var template = $('#cashflow-recon-detail-table').html();
    		Mustache.parse(template);   
		var rendered = Mustache.render(template,{recons:data});
		$('#detail-form').html(rendered);
	});
}


function start_inprogress()
{

	$('#in-progress').html(please_wait);

}

function stop_inprogress()
{

	$('#in-progress').html("");

}

function do_nothing(){}

function close_detail()
{
	$('#detail-form').html("");
}
	
function commify_all()
{

	$('.comma').each(function(obj) {
		$(this).html(numberWithCommas($(this).html()));
	});

}


function do_post(url,ps, cb){

	if( check_date() === 0 )
	{
		alert("Close date cannot be before start date.");
		return;
	}
	ps.xid = getCookie('xid');
	ps.access_slug = $('#cf_slug').val();
	start_inprogress();
	if( ps.access_slug === '')
	{

		alert("Access key blank.");
		stop_inprogress();

	} else {
		
		$.get('//' +site_url + ':' + port + '/app', ps, function(data){
			stop_inprogress();
			if( data.error == 1)
			{
				alert(data.error_message);
			} else {
				cb(data);
			}
		});

	}

}


function get_cashflow_els(cb)
{

	do_post('server',{p:'gcfels'}, function( data ){
		cfels = data;
		cb(data);
	});


}

function download_all()
{
	window.location.href="file?p=ead&access_slug=" + $('#cf_slug').val();
}

function restore_all()
{
	var template = $('#restore-backup').html();
    Mustache.parse(template);   
	var rendered = Mustache.render(template);
	$('#upload_restore').html(rendered);

}

function get_current_reconciliation_total()
{

	var ps = {
		p:"get_current_reconciliation", open_period: open_period, close_period: close_period
	};
	
	do_post('server',ps,function(data){
		console.log(data);
	});


}

function settings()
{
	reset_home();
	introjs_page = 'settings';
	var template = $('#settings').html();
	Mustache.parse(template);   
	var rendered = Mustache.render(template);
	$('#main_content').html(rendered);

}

function add_new_caption()
{
	var template = $('#new-caption').html();
	Mustache.parse(template);   
	var rendered = Mustache.render(template);
	$('#main_content').html(rendered);

}

function set_open_date(date)
{
	$('#stbd').val(date);
}

function set_close_date(date)
{

	$('#etbd').val(date);

}

function delete_tb_entries(date)
{
	do_post('server',{p:'dtbe', period:date}, function(data){
		import_tb();
	});
}


function import_tb()
{
	introjs_page = 'import_tb';
	close_rec();
	var template = $('#import-trial-balance').html();
	Mustache.parse(template);   
	var tb_upload = Mustache.render(template);

	do_post('server',{p:"gpp"},function(data){
		var template = $('#periods-posted').html();
		Mustache.parse(template);   
		var periods_posted = Mustache.render(template, data);
		$('#main_content').html(tb_upload + "<div style='width:50%'>" + periods_posted + "</div>");
		$( ".datepicker" ).datepicker({ dateFormat: 'yy-mm-dd' });

	});

}

function show_reconcile (aid, starting, ending, delta) 
{

	window.scrollTo(0,0);
	account_id = aid;
	open_period = starting;
	close_period = ending;
	
	starting_difference = delta;
	get_rec_data();


}

function show_note(caption)
{
	
	note_caption = caption;

	var myModal = new bootstrap.Modal(document.getElementById('notesModal'), {
		keyboard: false
  	});
	note_modal = myModal;

	var ps = {
		p:"get_note", account_id: account_id, open_period: open_period, close_period: close_period, note_caption: caption
	};
	console.log(ps);
	do_post('server',ps, function(data){
		$('#reconciliation_notes_text').val(data.note_text);
		myModal.show();
	});
  	

}

function save_note()
{
	note_modal.hide();
	do_post('server',{p:"scfn", account_id: account_id, open_period: open_period, close_period: close_period, note_caption: note_caption, reconciliation_text: $('#reconciliation_notes_text').val()},function(data){
	});

}

function get_rec_data()
{

	var ps = {
		'p':'gr',
		'account_id': account_id,
        	'open_period': open_period,
		'close_period': close_period
	};

	do_post('server',ps, function( data ){
		starting_difference = data.delta;
		populate_rec_table( data );
	});

}

function populate_rec_table( recdata )
{

	$('#reconcile-form').html("");
	
 	select_options = '';

	for (i = 0; i < cfels.length; i++)
	{
		select_options += "<option>" + cfels[i] + "</option>";
	}
	
	elnames = [];
	reconciled_difference = 0;
	for (i = 0; i < recdata.lines.length; i++)
	{
		elnames.push(recdata.lines[i].var_name);
		reconciled_difference += parseFloat(recdata.lines[i].rec_value);
	}
	unreconciled_difference = parseFloat( starting_difference ) + parseFloat( reconciled_difference );

	var template = $('#recform').html();

 	Mustache.parse(template);   
 	var rendered = Mustache.render(template, { 'recdata':recdata.lines, 
		'account_id': account_id, 
		'account_name':recdata.account_name, 
		'open_balance':recdata.open_balance, 
		'close_balance':recdata.close_balance, 
		'delta':recdata.delta 
	});

  	$('#reconcile-form').html(rendered);

	update_rec_table( reconciled_difference, unreconciled_difference );

}

function update_rec_table( reconciled_difference, unreconciled_difference )
{
	document.getElementById('reconciled_difference').innerHTML = reconciled_difference ;
	document.getElementById('unreconciled_difference').innerHTML = unreconciled_difference ;
	
}

function delete_row( row_num  )
{
	
	var ps = {
		'p': "dr",
		'id': row_num
	};
	do_post('server',ps,function( data ){
		update_rec();
		get_rec_data();
	});

}

function insert_row () 
{
	get_cashflow_els(function(cfe){
		
		var table = document.getElementById("recitems");

		var row = table.insertRow(table.length);

		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		var cell4 = row.insertCell(3);
		
		cell2.align = "center";
		cell3.align = "center";
		cell4.align = "center";

		var row_num = table.length;
		var row_txt = '';
		for (i = 0; i < cfe.length; i++)
		{
			row_txt += "<option>" + cfe[i] + "</option>";
		}

		var var_name = makeid(4);
		
		elnames.push(var_name);
		cell1.innerHTML = "<select class=sw id='"+ var_name +"_name'>" + row_txt + "</select>";
		cell2.innerHTML = "<input class='number_input' type=text id='"+ var_name +"_open_period' disabled value='" + open_period + "' size=10>";
		cell3.innerHTML = "<input class='number_input' type=text id='"+ var_name +"_close_period' disabled value='" + close_period + "' size=10>";
		cell4.innerHTML = "<input class='number_input' type=text id='"+ var_name +"_value' value=0 onChange='javascript:update_rec(this);' size=10>";
	});

}

function update_rec( inp )
{
	
	recons = [];
	reconciled_difference = 0;
	for( i = 0; i<elnames.length;i++)
	{
		var vv = '#'+elnames[i]+'_value';
		var vn = '#'+elnames[i]+'_name';
		if($(vv).val() === ""){
			$(vv).val(0);
		}
		reconciled_difference += parseFloat( $(vv).val() );
	}

	unreconciled_difference = parseFloat($('#delta').html()) + reconciled_difference;
	
	update_rec_table(reconciled_difference, unreconciled_difference );

}

function close_rec()
{
	$('#reconcile-form').html("");
}

function save_rec()
{
	
	var recons2 = [];
	recons = [];

	for( i = 0; i<elnames.length;i++)
	{
		var vv = '#'+elnames[i]+'_value';
		var vn = '#'+elnames[i]+'_name';
		var op = '#'+elnames[i]+'_open_period';
		var cp = '#'+elnames[i]+'_close_period';

		recons2.push([{
			caption_description: $(vn).val(), 
			value: $(vv).val(),
			open_period: $(op).val(),
			close_period: $(cp).val()
		}]);

	}
	
	var reconcilation_ar = '';

	var p = {
		'p': "sr",
		'account_id': account_id,
        'open_period': open_period,
		'close_period': close_period,
        'recons': JSON.stringify(recons),
		'recons2': btoa(JSON.stringify(recons2))

	};
	
	

	do_post('server',p, function( data ){
		
		$('#reconcile-form').html("");
		account_id = '';
		start_period = '';
		close_period = '';
		load_scf();
	});
	


}

function save_new_caption()
{

	var ps = {
		p: 'snscfc',
		caption_description: $('#caption_description').val(),
		section_type: $('#section_type').val()
	};
	
	do_post('server',ps,function(data){
	
        	load_scf_captions();

	});

}
function purge()
{
	if(confirm("This will delete all data stored on this access key. Continue?")){

		do_post('server',{'p':'purge'}, function(){
			alert("All data for access key deleted");

		});
	}


}
function delete_caption(id, used_count)
{

	if(used_count === '')
	{
		do_post('server',{p:'dscfc', id: id}, function(data){

    	    		load_scf_captions();

		});
	} else {
		alert("This caption is currently being used. Remove SCF reconciliation before deleting.");

	}

}

function edit_caption(id)
{
	var ps = {
		p: 'gscfc',
		id: id,
		caption_description: $('#caption_description').val(),
		section_type: $('#section_type').val()
	};

	do_post('server',ps, function(data){
		var template = $('#edit-caption').html();
    		Mustache.parse(template);   
		var rendered = Mustache.render(template, { 'caption_description': data.caption_description, 'id': data.id, 'section_type': data.section_type});
		$('#main_content').html(rendered);
	});

}

function save_edit_caption(id)
{

	var ps = {
		p: 'sescfc',
		id: id,
		caption_description: $('#caption_description').val(),
		section_type: $('#section_type').val()
	};

	do_post('server',ps, function(data){

        	load_scf_captions();

	});

}

function uploadFile(type)
{
	
	if($('#date').val() === '' && type === 'trial_balance')
	{ 
		alert("Set trial balance closing date to load.");
	} else {

		uploadFile_go(type).then(data => {
			$('#main_content').html(data);

			if( type === 'trial_balance')
			{
				$('#main_content').append('<a href="javascript:load_trial_balance();" class="btn btn-primary">Review Trial Balance Mapping</a>');
			}
			if( type === 'scf_captions')
			{
				$('#main_content').append('<a href="javascript:load_scf_captions();" class="btn btn-primary">Review SCF Captions</a>');
			}
		});
	}

}


async function uploadFile_go(type) {

    formData = new FormData();
    formData.append("file", document.getElementById("file_name").files[0]);
    formData.append('file_name', $('#cf_slug').val() + ".data");
	formData.append('date', $('#date').val() );
	formData.append('title', type + ".csv");
	formData.append('upload_type', type );
	formData.append('access_slug', $('#cf_slug').val() );
    var data = await fetch('/file', {
    	method: "POST",
    	body: formData
    });
    var response_data = await data.text();
	return response_data;
}

function upload_captions()
{
	var template = $('#upload-scf-captions').html();
	Mustache.parse(template);   
	var rendered = Mustache.render(template);
	$('#main_content').html(rendered);
}

function upload_trial_balance_coding()
{
	var template = $('#upload-trial-balance-coding').html();
	Mustache.parse(template);   
	var rendered = Mustache.render(template);
	$('#main_content').html(rendered);
}

function get_keys_for_combination(){
	var template = $('#get-keys-for-combination').html();
	Mustache.parse(template);   
	var rendered = Mustache.render(template);
	$('#main_content').html(rendered);
	$('#combine_keys').val($('#cf_slug').val() + ",");
}

function reset_home()
{
	introjs_page = '';
	close_rec();
	close_detail();

	var template = $('#home-reset').html();
	Mustache.parse(template);   
	var rendered = Mustache.render(template);

	$('#main_content').html(rendered);
}


function load_scf_captions()
{
	close_rec();
	introjs_page = 'scf_captions';
	var template = $('#scf-caption-template').html();
    	Mustache.parse(template);   
	
	do_post('server',{p: "scfc"  },function(data){
        	var rendered = Mustache.render(template, data);
	        $('#main_content').html(rendered);
	});

}


function makeid(length) {
	var text = "";
  	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  	for (var i = 0; i < length; i++)
    		text += possible.charAt(Math.floor(Math.random() * possible.length));

  	return text;
}


function check_date(){
	const open_date = new Date($('#stbd').val());
	const close_date = new Date($('#etbd').val());
	if(close_date < open_date)
	{
		return 0;
	} else {
		return 1;
	}
}

function load_scf()
{
	
	introjs_page = 'load_scf';
	close_rec();
	
	var template = $('#trial-balance-recon').html();
    	Mustache.parse(template);   

	open_period = $('#stbd').val();
	close_period = $('#etbd').val();
	var obj = {p: "ltm", stbd: $('#stbd').val(), etbd: $('#etbd').val()  };
	var rendered;	

	do_post('server',obj,function(data){

		var temp_data = { tb:data.trial_balance, 'starting':$('#stbd').val(), 'ending': $('#etbd').val()};	
        	var rendered = Mustache.render(template, temp_data);
	        $('#main_content').html(rendered);
		commify_all();
		get_cashflow_els(function(data){
			cfels = data;	
		});

	});

}
function set_dates_tb()
{

	var myModal = new bootstrap.Modal(document.getElementById('exampleModal'), {
		keyboard: false
	  });


	  do_post('server',{p:"gpp"},function(data){
		var template = $('#periods-posted-pop-up').html();
    		Mustache.parse(template);   
		var periods_posted = Mustache.render(template, data);
		$('#set_dates_tb').html(periods_posted);
		myModal.show();

	});

}

function show_combined_scf(url)
{

	if(check_date() === 0)
	{
		alert("Close date cannot be before start date.");
		return;
	}

	if(open_period == undefined)
	{
		alert('Load reconciliation first');
	} else {
		url += 'p=cscf&open_period=' + open_period + '&close_period=' + close_period + "&access_slugs=" + $('#combine_keys').val();
		popupWindow = window.open(url,'popUpWindow2','height=800,width=800,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
	}
}

function trim_whitespace(id)
{

	$('#' + id).val( $('#' + id).val().replace(/\s/gm,'') );
}

function show_statement(url)
{

	if(check_date() === 0)
	{
		alert("Close date cannot be before start date.");
		return;
	}

	if(open_period == undefined)
	{
		alert('Load reconciliation first');
	} else {
		url += 'p=scf&open_period=' + open_period + '&close_period=' + close_period + "&access_slug=" + $('#cf_slug').val();
		popupWindow = window.open(url,'popUpWindow1','height=800,width=800,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
	}
}

function show_matrix(url)
{
	if(open_period == undefined)
	{
		alert('Load reconciliation first');
	} else {
		url += 'p=mscf&open_period=' + open_period + '&close_period=' + close_period + "&access_slug=" + $('#cf_slug').val();
		popupWindow = window.open(url,'popUpWindow3','height=800,width=1500,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes, addressbar=no');
	}
}


function show_trial_balance(url)
{

	if(check_date() === 0)
	{
		alert("Close date cannot be before start date.");
		return;
	}

	if(close_period == undefined)
	{
		alert('Load reconciliation first');
	} else {
		url += 'p=vtb&open_period=' + open_period + '&close_period=' + close_period +"&access_slug=" + $('#cf_slug').val();
		popupWindow2 = window.open(url,'popUpWindow2','height=800,width=800,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
	}
}

function reconcile_popup(id, starting,ending){
	//console.log(id + " " + starting + " " + ending);
}

function load_trial_balance()
{
	close_rec();
	introjs_page = 'load_trial_balance';
	var template = $('#trial-balance-tmpl').html();
    	Mustache.parse(template);   


	do_post('server',{p: "gtm", access_slug:$('#cf_slug').val() },function(data){		
        var rendered = Mustache.render(template, { 'account_list':data.account_list });
		$('#main_content').html(rendered);
	});

}

function download_trial_balance_coding()
{
	do_post('server',{p:"dtbc", access_slug:$('#cf_slug').val()}, function(obj){

		//convert json obj to a csv string to pass to downloadCSV
		var fields = Object.keys(obj[0]);
		var replacer = function(key, value) { return value === null ? '' : value } ;
		var csv = obj.map(function(row){
  			return fields.map(function(fieldName){
    			return JSON.stringify(row[fieldName], replacer)
  			}).join(',');
		});
		csv.unshift(fields.join(',')); // add header column
 		csv = csv.join('\r\n');
		downloadCSV(csv, "trial_balance_mapping.csv");

	});
	
	//console.log(csv);


}

function set_account_type(id,type)
{
	do_post('server', {p:"stm", account_type: type, id: id}, function(data){
		//console.log(data);

	});
	//console.log(id + " " + type);
}
function delete_account(id)
{
	do_post('server', {p:"dta", id: id}, function(data){
		//console.log(data);
		load_trial_balance();
	});

}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
	  let c = ca[i];
	  while (c.charAt(0) == ' ') {
		c = c.substring(1);
	  }
	  if (c.indexOf(name) == 0) {
		return c.substring(name.length, c.length);
	  }
	}
	return "";
  }

//SaaS95 Copyright © 2023 by Caleb Stephens

const mysql = require('mysql2/promise');
const express = require('express')
const app = express()
const cors = require('cors');
const mustacheExpress = require('mustache-express');
const mustache = require('mustache');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const config = require('./config.js');
const engines = require('consolidate');

const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


app.use(express.static('resources'));
app.use(cors());
app.engine('html', engines.mustache);
app.set('view engine', 'html');
app.set('views', __dirname + '/resources');

const upload = multer({ dest: "uploads/" });


app.get('/', function (req, res) {
  	res.send("Load App")
})


app.get('/report', function (req, res) {

	res.setHeader('content-type','text/html');
	app.engine('html', engines.mustache);

	req.query.open_period = sanitize_date(req.query.open_period);
	req.query.close_period = sanitize_date(req.query.close_period);

	switch( req.query.p )
	{
		case 'scf': prepare_scf(req,res); break;
        case 'vtb': view_tb(req,res); break;
		case 'mscf': prepare_matrix_scf(req, res);break;
		case 'cscf': prepare_consolidating_scf(req, res); break;
		default: res.send("Report not found")
	}

});

app.get('/app', function (req, res) {

	res.setHeader('content-type','application/json');
	app.engine('html', engines.mustache);
	req.query = sanitize(req.query);

	switch( req.query.p )
	{
		case 'dtbc': dtbc(req,res); break;
		case 'ltm': ltm(req,res); break;
		case 'ck_slug': ck_slug(req, res); break;
		case 'gcfels': gcfels(req, res); break;
		case 'get_current_reconciliation':get_current_reconciliation(req, res); break;
		case 'dtbc':dtbc(req, res); break;
		case 'dtbe':dtbe(req, res); break;
		case 'gpp':gpp(req, res); break;
		case 'purge':purge(req, res); break;
		case 'sescfc':sescfc(req, res); break;
		case 'dscfc':dscfc(req, res); break;
		case 'snscfc':snscfc(req, res); break;
		case 'gscfc':gscfc(req, res); break;
		case 'scfc':scfc(req, res); break;
		case 'dta':dta(req, res); break;
		case 'gtm':gtm(req, res); break;
		case 'stm':stm(req, res); break;
		case 'sr':sr(req, res); break;
		case 'dr':dr(req, res); break;
		case 'gr':gr(req, res); break;
		case 'get_note':get_note(req, res); break;
		case 'scfn':scfn(req, res); break;
		case 'gcd':gcd(req, res); break;
		default: res.send('function not found')
	}
	
})

app.get('/file', function(req, res) {
	
 	switch( req.query.p )
	{
		case 'ead': export_all_data(req, res);break;
		default: res.send('file type not found');break;
	}

})

app.post('/file', upload.single('file'), function(req, res){

	switch( req.body.upload_type )
	{
		case 'trial_balance': save_trial_balance(req, res, req.file.filename); break;
		case 'scf_captions': save_new_cashflow_captions(req, res, req.file.filename); break;	
		case 'trial_balance_coding': save_trial_balance_coding(req, res, req.file.filename);break;
		case 'restore': restore_from_backup(req, res, req.file.filename);break;
		default: res.send('file type not found');break;
	}

});

app.get('/resource', function(req, res) {

	switch( req.query.p )
	{
		case 'variables': get_site_variables(req, res);break;
		default: res.send('resource not found');break;
	}

});



app.listen(config.port, ()=>{
	console.log('SaaS95 running; view at ' + config.site_url + ":" + config.port + "/main.html");
});

function sanitize(r)
{
	for( i in r )
	{
		r[i] = r[i].replace(/\</,'');
		r[i] = r[i].replace(/\>/,'');
		r[i] = r[i].replace(/\%/,'');
		r[i] = r[i].replace(/\;/,'');
		r[i] = r[i].replace(/\.\./g,'');
		r[i] = r[i].replace(/'/g,'');
		r[i] = r[i].replace(/echo/,'');
		r[i] = r[i].replace(/script/g,'');
	}

	return r;

}
function sanitize_date(d)
{
		let nd = new Date(d);
		let e = nd.toISOString().split("T");
		return e[0];
}

function get_site_variables(req, res)
{
	res.setHeader('content-type','text/javascript');
	res.render('variables', {site_url: config.site_url, port: config.port});
}


async function dtbc(req,res)
{
	let query = 'select * from cf_trial_balance_mapping where access_slug=?';
	let accounts = [];
	let ret = [];

	const [results] = run_query(query, [req.query.access_slug]);

	for ( i in results )
	{
		accounts.push({ account_caption: results[i].account_caption, account_type: results[i].account_type});
	}

	res.send(JSON.stringify(accounts));

}

function get_delta (account_type, starting_debit, starting_credit, ending_debit, ending_credit, return_value)
{
	return_value = 0;

	if(typeof starting_debit == 'undefined')
		starting_debit = 0;
	if(typeof starting_credit == 'undefined')
                starting_credit = 0;
	if(typeof ending_debit == 'undefined')
                ending_debit = 0;
	if(typeof ending_credit == 'undefined')
                ending_credit = 0;


	switch( account_type ){

		case "cash": 
			return_value = 0; 
			break;
		case "assets": 
			return_value = (ending_debit - ending_credit) - (starting_debit - starting_credit); 
			break;
		case "contra assets":
			return_value = (ending_debit - ending_credit) - (starting_debit - starting_credit);
			break;
		case "liabilities":
			return_value = (starting_credit - starting_debit) - (ending_credit - ending_debit);
			break;
		case "contra liabilities":
			return_value = (ending_debit - ending_credit) - (starting_debit  - starting_credit);
			break;
		case "equity":
			return_value = (starting_credit - starting_debit) - (ending_credit - ending_debit);
			break;
		case "contra equity":
			return_value = (ending_debit - ending_credit) - (starting_debit  - starting_credit);
			break;
		default:
			return_value = 0;
	}

	return parseFloat(return_value).toFixed(2);

}

async function ltm(req,res)
{

	ltm_func(req, res).then((tb)=>{
		res.send(JSON.stringify({trial_balance: tb}));
	});


}

async function ltm_func(req, res)
{
	let query = 'select * from cf_trial_balance_mapping where access_slug=?';
	let accounts = [];
        
	let [results] = await run_query(query, [req.query.access_slug]);
	let account_captions_by_id = {};
	let account_mapping = {};
	let account_id = {};
	let reconciled = {};

    for (k in results)
	{
		account_captions_by_id[results[k].id] = results[k].account_caption;
		account_mapping[results[k].account_caption] = results[k].account_type;
		account_id[results[k].account_caption] = results[k].id;
		reconciled[ results[k].id ] = 0;
	}
        
	query = 'select * from cf_rec_table where open_period>=? and close_period<=? and access_slug=?';
        
	[results] = await run_query(query, [req.query.stbd, req.query.etbd, req.query.access_slug]);

	for( i in results )
	{
		reconciled[ results[i].account_id ] = parseFloat(reconciled[ results[i].account_id ]) + parseFloat(results[i].rec_value);
	}

	query = `select
                        tb.*,tbm.account_type
                from
                        cf_trial_balance tb, cf_trial_balance_mapping tbm
                where
                        tb.account_caption = tbm.account_caption and
                        tb.period_date=? and
                        tbm.account_type in ('assets', 'contra assets', 'liabilities','contra liabilities', 'equity', 'contra equity')
                        and tb.access_slug=?
                        or
                        tb.account_caption = tbm.account_caption and
                        tb.period_date=? and
                        tbm.account_type in ('assets', 'contra assets', 'liabilities','contra liabilities', 'equity', 'contra equity')
                        and tb.access_slug=?
                order by tbm.account_type`;



	let [start_date_results] = await run_query(query, [req.query.stbd, req.query.access_slug, req.query.stbd, req.query.access_slug]);
	let [end_date_results] = await run_query(query,  [req.query.etbd, req.query.access_slug, req.query.etbd, req.query.access_slug] );

	let trial_balance_h = {};
	let trial_balance_a = [];

	for( i in start_date_results )
	{
		trial_balance_h[start_date_results[i].account_caption] = {};
	}
 	for( i in end_date_results )
	{
		trial_balance_h[end_date_results[i].account_caption] = {};
	}


	for(i in start_date_results)
	{
		trial_balance_h[start_date_results[i].account_caption]['starting_debit'] = Math.abs(start_date_results[i].debit);
		trial_balance_h[start_date_results[i].account_caption]['starting_credit'] =  Math.abs(start_date_results[i].credit);
	}

	for(i in end_date_results)
	{
		trial_balance_h[end_date_results[i].account_caption]['ending_debit'] = Math.abs(end_date_results[i].debit);
		trial_balance_h[end_date_results[i].account_caption]['ending_credit'] =  Math.abs(end_date_results[i].credit);
	}
	
	//Order the object
	const ordered_tb = Object.keys(trial_balance_h).sort().reduce(
  		(o, k)=>{
    			o[k]=trial_balance_h[k];
    			return o;
  		}, {}
 	);

	for( i in ordered_tb )
	{
		let delta = parseFloat(get_delta( account_mapping[i], ordered_tb[i].starting_debit, ordered_tb[i].starting_credit, ordered_tb[i].ending_debit, ordered_tb[i].ending_credit )).toFixed(2);

		let reconciliation_complete_number = parseFloat( delta ) + parseFloat(reconciled[ account_id[i] ] );
		
		let reconciliation_complete;

		if( Math.abs(reconciliation_complete_number) > 0 )
		{
			reconciliation_complete = 0;
		} else {
			reconciliation_complete = 1;
		}			

		let starting = get_true_balance(account_mapping[i], ordered_tb[i].starting_debit, ordered_tb[i].starting_credit);
		let ending = get_true_balance(account_mapping[i], ordered_tb[i].ending_debit, ordered_tb[i].ending_credit);

		trial_balance_a.push({
			account_caption: i,
			account_type: account_mapping[i],
			starting: starting,
			ending: ending,
			delta: delta,
			start_date: req.query.stbd,
			end_date: req.query.etbd,
			id: account_id[i],
			reconciliation_complete: reconciliation_complete,
			reconciliation_complete_number: reconciliation_complete_number,
			reconciled: parseFloat( reconciled[ account_id[i] ] ).toFixed(2)
        });

	}

	return trial_balance_a;

}

async function get_previous_reporting_period(req)
{
	let query = `select * from cf_trial_balance where period_date<? and access_slug=? order by period_date desc limit 1`;
	let last_reporting_date = await run_query(query, [req.query.close_date]);
	let date = last_reporting_date.period_date;
	return date;
}

async function get_account_sections(req)
{

	let query = `
	select 
		sum(rt.rec_value) rec_value,
    	scf.section_type, 
		tbm.account_caption
    
	from 
		statement_of_cashflows scf
		inner join cf_rec_table rt on scf.id = rt.cashflow_caption_id
		inner join cf_trial_balance_mapping tbm on rt.account_id = tbm.id

	where
		rt.open_period >= ?
        	and rt.close_period <= ?
		and rt.access_slug=?
	group by 
		scf.section_type, tbm.account_caption`;

	let [results] = await run_query(query, [req.query.open_period, req.query.close_period, req.query.access_slug]);

	let sec_acct = {};
	
	for( i in results )
	{
		sec_acct[results[i].account_caption] = {};	
	}

	for( i in results )
	{
		sec_acct[results[i].account_caption][results[i].section_type] = parseFloat(results[i].rec_value);
	}

	return sec_acct;

}

function get_true_balance(account_type, debit, credit)
{

	if(typeof debit == 'undefined')
		debit = 0;
	if(typeof credit == 'undefined')
		credit = 0;

	let return_value = 0;

	switch( account_type ){

		case "cash":
			return_value = debit - credit;
		break;
		case "assets":
			return_value = debit - credit;
			break;
		case "contra assets":
			return_value = debit - credit;
			break;
		case "liabilities":
			return_value = credit - debit;
			break;
		case "contra liabilities":
			return_value = debit - credit;
			break;
		case "equity":
			return_value = credit - debit;
			break;
		case "contra equity":
			return_value = debit - credit;
			break;
		default:
			return_value = 0;
		break;
	}

	return parseFloat(return_value).toFixed(2);

}

async function ck_slug(req, res)
{
	res.send( JSON.stringify( {"status":"OK"} ));
}

async function gcfels(req,res)
{
	let query = 'select * from statement_of_cashflows where access_slug=? order by section_type asc';
	let [results] = await run_query(query, [req.query.access_slug]);

	let cfels = [];
	for( i in results)
	{
		cfels.push(results[i].caption_description);
	}
	res.send(JSON.stringify(cfels));
}

async function get_current_reconciliation(req, res)
{

	let query = `
		select 
			tb.period_date,sum(tb.debit) as debit_sum, sum(tb.credit) credit_sum 
		from 
			cf_trial_balance tb, cf_trial_balance_mapping tbm
		where 
			tb.period_date in (?, ?) 
			and tbm.account_type = "cash"
			and tb.account_caption = tbm.account_caption
			and tb.access_slug=?
			and tb.access_slug = tbm.access_slug
		group by tb.period_date`;

	let [results] = await run_query(query, [req.query.open_period, req.query.close_period, req.query.access_slug]);


	let cash_balances = {};
	for(i in results)
	{
		
		cash_balances[results[i].period_date] = results[i].debit_sum - results[i].credit_sum;
	}
	
	let change_in_cash = get_value_or_zero(cash_balances[req.query.close_period]) - get_value_or_zero(cash_balances[req.query.open_period]);


	query = `select 
        	credit - debit as cr_dr
    		from cf_trial_balance tb 
    		left join 
        	cf_trial_balance_mapping tbm 
    		on 
        	tbm.account_caption = tb.account_caption
    		where 
        	tb.access_slug=?
        	and tb.period_date >= ?
        	and tb.period_date <= ?
        	and tbm.account_type in ('revenue', 'expense')
    		group by tb.account_caption
	`;

	[results] = await run_query(query, [req.query.access_slug, req.query.open_period, req.query.close_period]);
	let net_income = 0;
	for(i in results)
	{
		net_income += results[i].cr_dr;

	}

	query = `select sum(rec_value) as total_recs from cf_rec_table where access_slug=? and open_period=? and close_period=?`;
	[results] = await run_query(query, [req.query.access_slug, req.query.open_period, req.query.close_period]);

	let total_recs = get_value_or_zero(results[0].total_recs);

	let total_reconciled = get_value_or_zero(net_income) + get_value_or_zero(total_recs);

	res.send(JSON.stringify({total_reconciled: total_reconciled, net_income: net_income, total_recs: total_recs, change_in_cash: change_in_cash}));

}

async function dtbc(req,res)
{

	let query = `select * from cf_trial_balance_mapping where access_slug=?`;
	let [results] = await run_query(query, [req.query.access_slug]);
	
	let accounts = [];
	for( i in results )
	{
		accounts.push({account_caption: results[i].account_caption, account_type: results[i].account_type});
	}
	res.send(JSON.stringify(accounts));
}

async function dtbe(req,res)
{
	await run_query(`delete from cf_trial_balance where period_date=? and access_slug=?`, [req.query.period, req.query.access_slug]);
	res.send(JSON.stringify({status: "OK"}));
}

async function gpp(req,res)
{
	res.setHeader('content-type','application/json');

	let query = `select distinct DATE_FORMAT(period_date,"%Y-%m-%d") as period_date from cf_trial_balance where access_slug=? order by period_date desc`;
	let [results] = await run_query(query, [req.query.access_slug]);
	
	let re = [];
	for( i in results )
	{
		re.push( results[i] );
	}

	res.send(JSON.stringify(re));
}

async function purge(req,res)
{
	await run_query(`delete from cf_trial_balance where access_slug=?`, [ req.query.access_slug ]);
	await run_query(`delete from cf_trial_balance_mapping where access_slug=?`, [req.query.access_slug] );
	await run_query(`delete from cf_rec_table where access_slug=?`, [req.query.access_slug]);
	await run_query(`delete from cf_reconciliation_notes where access_slug=?`, [req.query.access_slug]);
	await run_query(`delete from statement_of_cashflows where access_slug=?`, [req.query.access_slug]);

	res.send(JSON.stringify({status: "OK"}));

}

async function sescfc(req,res)
{
	await run_query(`update statement_of_cashflows set caption_description=?, section_type=? where id=? and access_slug=?`, [req.query.caption_description, req.query.section_type, req.query.id, req.query.access_slug]);
	res.send(JSON.stringify({status:"OK"}));
}

async function dscfc(req,res)
{
	await run_query(`delete from statement_of_cashflows where id=? and access_slug=?`, [req.query.id, req.query.access_slug]);
	res.send(JSON.stringify({status:"OK"}));
}

async function snscfc(req,res)
{
	res.setHeader('content-type','application/json');
	await run_query(`insert into statement_of_cashflows (caption_description, section_type, access_slug) values (?,?, ?)`, [req.query.caption_description, req.query.section_type, req.query.access_slug]);
	res.send(JSON.stringify({status:"OK"}));
}

async function gscfc(req,res)
{
	let query = `select * from statement_of_cashflows where id=? and access_slug=?`;
	const [results] = await run_query(query, [req.query.id, req.query.access_slug]);
	res.send(JSON.stringify(results[0]));
}

async function scfc(req,res)
{
	let query = `select cashflow_caption_id,count(*) cnt from cf_rec_table where access_slug=? group by cashflow_caption_id`;
	let [results] = await run_query(query, [req.query.access_slug]);
	
	let counts = [];
	for( i in results )
	{
		counts[results[i].cashflow_caption_id] = results[i].cnt;
	}

	query = `select * from statement_of_cashflows where access_slug=?`;
	[results] = await run_query(query, [req.query.access_slug]);
	let captions = [];
	for( i in results )
	{
		results[i]['used_count'] = counts[results[i].id];
		captions.push( results[i]  );

	}
	res.send(JSON.stringify(captions));

}

async function dta(req,res)
{
	await run_query(`delete from cf_trial_balance_mapping where id=? and access_slug=?`, [req.query.id, req.query.access_slug]);
	res.send(JSON.stringify({status:"OK"}));
}

async function gtm(req,res)
{
	let query = `select * from cf_trial_balance_mapping where access_slug=?`;
	let [results] = await run_query(query, [req.query.access_slug]);
	let account_list = [];
	for( i in results)
	{
		account_list.push( results[i] );
	}

	res.send(JSON.stringify({account_list: account_list}));
}

async function stm(req,res)
{
	await run_query(`update cf_trial_balance_mapping set account_type=? where id=? and access_slug=?`,[req.query.account_type, req.query.id, req.query.access_slug]);
	res.send(JSON.stringify({status: "OK"}));
}

async function sr(req,res)
{
	let recons2 = JSON.parse( Buffer.from(req.query.recons2, 'base64').toString() );
	let query = `select * from statement_of_cashflows where access_slug=?`;
	let [results] = await run_query(query, [req.query.access_slug]);
	let captions = {};
	for( i in results)
	{
		captions[results[i].caption_description] = results[i].id;
	}
	for( i in recons2)
	{		
		await run_query(`delete from cf_rec_table where account_id=? and open_period=? and close_period=? and access_slug=?`, [req.query.account_id, recons2[i][0].open_period, recons2[i][0].close_period, req.query.access_slug]);
	}

	query = `insert into cf_rec_table (cashflow_caption_id, open_period, close_period, rec_value, account_id, access_slug) values (?, ?, ?, ?, ?, ?)`;
	for (i in recons2)
	{
		await run_query(query, [ captions[recons2[i][0].caption_description], recons2[i][0].open_period,  recons2[i][0].close_period, recons2[i][0].value, req.query.account_id, req.query.access_slug]);

	}

	res.send(JSON.stringify({status: "OK"}));
}

async function dr(req,res)
{

	let query = `select * from cf_rec_table where id=? and access_slug=?`;
	let [results] = await run_query(query,[req.query.id, req.query.access_slug]);

	await run_query(`delete from cf_reconciliation_notes where cashflow_caption_id=? and open_period=? and close_period=? and account_id=? and access_slug=?`,
                [results[0].cashflow_caption_id, results[0].open_period, results[0].close_period, results[0].account_id, req.query.access_slug]);
        await run_query(`delete from cf_rec_table where id=? and access_slug=?`, [req.query.id, req.query.access_slug]);

	res.send(JSON.stringify({'status': "OK"}));
}

async function gr(req,res)
{
	let query = `select * from cf_trial_balance_mapping where id=? and access_slug=?`;
	let [account] = await run_query(query, [req.query.account_id, req.query.access_slug]);


	query = `select * from statement_of_cashflows where access_slug=?`;
	let [results] = await run_query(query, [req.query.access_slug]);

	let captions = {};
	for( i in results )
	{
		captions[results[i].id] = results[i].caption_description;
	}

	query = `select *,DATE_FORMAT(open_period, "%Y-%m-%d") as open_period, DATE_FORMAT(close_period,"%Y-%m-%d") as close_period from cf_rec_table where account_id=? and open_period >= ? and close_period <= ? and access_slug=?`;
	[results] = await run_query(query,[ req.query.account_id, req.query.open_period, req.query.close_period, req.query.access_slug]);

	let lines = [];
	for( i in results )
	{
		let var_name  = generate_random_string(4);
		lines.push({ 
			caption: captions[results[i].cashflow_caption_id], 
			rec_value: results[i].rec_value, 
			id: results[i].id, 
			var_name: var_name, 
			open_period: results[i].open_period, 
			close_period: results[i].close_period
		});

	}

        let open_balance = {debit: 0, credit: 0};
	let close_balance = {debit: 0, credit: 0};

	await get_balance(req.query.open_period, account[0].account_caption, req.query.access_slug).then(function(r){
		open_balance.debit = get_value_or_zero(r.debit);
		open_balance.credit = get_value_or_zero(r.credit);
	});

	await get_balance(req.query.close_period, account[0].account_caption, req.query.access_slug).then(function(r){
		close_balance.debit = get_value_or_zero(r.debit);
		close_balance.credit = get_value_or_zero(r.credit);
	});


	let open_balance_dc = get_true_balance(account[0].account_type, open_balance.debit, open_balance.credit);
	let close_balance_dc = get_true_balance(account[0].account_type, close_balance.debit, close_balance.credit);

	let delta = get_delta(  
		account[0].account_type, 
		get_value_or_zero(open_balance.debit), 
		get_value_or_zero(open_balance.credit), 
		get_value_or_zero(close_balance.debit),
		get_value_or_zero(close_balance.credit)
	);

	let send = {lines: lines, 
		account_name: account[0].account_caption, 
		open_balance: open_balance_dc, 
		close_balance: close_balance_dc, 
		delta: delta};

	res.send(JSON.stringify(send));
}

async function get_note(req,res)
{

	let query = `select * from statement_of_cashflows where caption_description=? and access_slug=?`;
	let [results] = await run_query(query, [req.query.note_caption, req.query.access_slug]);


	query = `select * from cf_reconciliation_notes where account_id=? and cashflow_caption_id=? and open_period=? and close_period=? and access_slug=?`;
	let [notes] = await run_query(query, [req.query.account_id, results[0].id, req.query.open_period, req.query.close_period, req.query.access_slug]);

	if( notes.length === 0)
	{
		notes = [{note_text: ""}];
	}
 
	res.send(JSON.stringify(notes[0]));

}

async function scfn(req,res)
{

	let query = `select * from statement_of_cashflows where caption_description=? and access_slug=?`;
	let [results] = await run_query(query, [req.query.note_caption, req.query.access_slug]);

	query = `select * from cf_reconciliation_notes where account_id=? and cashflow_caption_id=? and open_period=? and close_period=? and access_slug=?`;
	let [cnt] = await run_query(query, [req.query.account_id, results[0].id, req.query.open_period, req.query.close_period, req.query.access_slug]);

	if( cnt.length !== 0 )
	{
		query = `update cf_reconciliation_notes set note_text=? where id=? and access_slug=?`;
		await run_query(query, [req.query.reconciliation_text, cnt[0].id, req.query.access_slug]);

	} else {

		query = `insert into cf_reconciliation_notes (account_id, cashflow_caption_id, open_period, close_period, note_text, access_slug) values (?, ?, ?, ?, ?, ?)`;
		await run_query(query, [req.query.account_id, results[0].id, req.query.open_period, req.query.close_period, req.query.reconciliation_text, req.query.access_slug]);

	}

	res.send({status: "OK"});

}


async function gcd(req,res)
{
	let query = `
	select 
		scf.caption_description, DATE_FORMAT(rt.open_period,"%Y-%m-%d") open_period, DATE_FORMAT(rt.close_period,"%Y-%m-%d") close_period, tbm.account_caption, rt.rec_value, tbm.id as account_id
	from 
		statement_of_cashflows scf, cf_trial_balance_mapping tbm, cf_rec_table rt
	where
		rt.cashflow_caption_id = ?
		and rt.cashflow_caption_id = scf.id
		and rt.account_id = tbm.id
		and rt.access_slug= ?
		and rt.open_period >= ?
		and rt.close_period <= ?`;

	let [results] = await run_query(query, [req.query.id, req.query.access_slug, req.query.open_period, req.query.close_period]);

	let recons = [];
	for( i in results )
	{
		recons.push(results[i]);
	}
	res.send(JSON.stringify(recons));

}

async function get_balance(date, account_caption, access_slug)
{

	let query = `
                select
                        distinct tb.*,tbm.account_type
                from
                        cf_trial_balance tb, cf_trial_balance_mapping tbm
                where
                        tb.account_caption = ?
                        and tb.period_date = ?
				and tb.account_caption = tbm.account_caption
                        and tbm.account_type in ('assets', 'contra assets', 'liabilities','contra liabilities', 'equity', 'contra equity')
				and tb.access_slug=?
		order by tbm.account_type
        `;

	let [results] = await run_query(query, [ account_caption, date, access_slug ]);

	if( results.length === 0 )
	{
		results[0] = {};;
		results[0].debit = 0;
		results[0].credit = 0;
	}

	return results[0];
}


function generate_random_string(length) 
{
    const characters = 'ABCDEFGHIJKLMNOP_-QRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    let i = 0;
    while (i < length) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
      i += 1;
    }
    return result;
}

function get_value_or_zero(n) 
{
  return n>0 ? parseFloat(n).toFixed(2) : parseFloat(0).toFixed(2);
}



async function prepare_scf(req, res)
{
	get_trial_balance_deltas(req, res).then((data)=>{
		res.render('statement_of_cashflows', data);
	});

}

async function prepare_matrix_scf(req, res)
{


	let data = await get_trial_balance_deltas(req, res);
	let account_sections = await get_account_sections(req);	
	let rec_table = await get_scf_rec_table(req);
	req.query.stbd = req.query.open_period;
	req.query.etbd = req.query.close_period;
	let tb = await ltm_func(req, res);

	create_matrix_scf(req, res, data, tb, account_sections, rec_table);

}


async function create_matrix_scf(req, res, d, tb, as, rt)
{
	app.engine('html', engines.ejs);
	let matrix_rec = {};
	let capar = [];
	for( i in tb )
	{
		if( typeof as[ tb[i].account_caption ] === "undefined")
		{
			as[ tb[i].account_caption ] = {
				"operating reconciliation": 0,
				"change in operating accounts": 0,
				investing: parseFloat(0),	
				financing: 0
			};
		}

	
		if( typeof as[ tb[i].account_caption ]["operating reconciliation"] === "undefined")
			as[ tb[i].account_caption ]["operating reconciliation"] = 0;

		if( typeof as[ tb[i].account_caption ]["change in operating accounts"] === "undefined")
			as[ tb[i].account_caption ]["change in operating accounts"] = 0;

		if( typeof as[ tb[i].account_caption ]["investing"] === "undefined")
			as[ tb[i].account_caption ]["investing"] = 0;

		if( typeof as[ tb[i].account_caption ]["financing"] === "undefined")
			as[ tb[i].account_caption ]["financing"] = 0;


		let cioa = parseFloat(as[ tb[i].account_caption ]['operating reconciliation']);
		let reconciling = parseFloat(as[ tb[i].account_caption ]['operating reconciliation']);
		let operating = cioa + reconciling;
		let investing = parseFloat(as[ tb[i].account_caption ]['investing']);
		let financing = parseFloat(as[ tb[i].account_caption ]['financing']);

		matrix_rec[ tb[i].account_caption ] = {
			starting: tb[i].starting,
			ending: tb[i].ending,
			delta: tb[i].delta,
			reconciling: reconciling,
			cioa: cioa,
			operating: operating,
			investing: investing,
			financing: financing
		};

		capar.push(tb[i].account_caption);
	}
	let m_obj = {open_period: d.open_period, close_period: d.close_period, net_income: d.adjusted_net_income, matrix_rec: matrix_rec, capar: capar, rt:rt, scf:d};
	res.render( 'matrix_report', {open_period: d.open_period, close_period: d.close_period, net_income: d.adjusted_net_income, matrix_rec: matrix_rec, capar: capar, rt: rt, scf:d});
}

async function get_scf_rec_table(req)
{

    	let query = `
		select
                rv.*, DATE_FORMAT(rv.open_period,"%Y-%m-%d") open_period, DATE_FORMAT(rv.close_period,"%Y-%m-%d") close_period,
                scf.caption_description,
		tbm.account_caption
            from
                cf_rec_table rv,
                statement_of_cashflows scf,
				cf_trial_balance_mapping tbm
            where
                rv.access_slug=?
                and rv.open_period>=?
                and rv.close_period<=?
                and rv.cashflow_caption_id = scf.id
                and rv.account_id = tbm.id

		`;
	let [results] = await run_query(query, [req.query.access_slug, req.query.open_period, req.query.close_period]);

	let rec_table = {};
	for(i in results)
	{
		rec_table[results[i].caption_description] = {};
	}
	for(i in results)
	{
		rec_table[results[i].caption_description][ results[i].account_caption] = 0;
	}
	for( i in results )
	{
		rec_table[results[i].caption_description][ results[i].account_caption ] += parseFloat(results[i].rec_value);
	}

	return rec_table;

}

function jlog (l)
{
	console.log(JSON.stringify(l, null, 3));
}

async function get_trial_balance_deltas(req, res)
{

	await run_query(`delete from cf_compiled_scf where access_slug=? and open_period=? and close_period=?`,[req.query.access_slug, req.query.open_period, req.query.close_period]);
    await run_query(`delete from cf_compiled_scf where open_period > close_period`);


	//### NET INCOME

	let query = `
	    select 
		(sum(tb.credit) - sum(tb.debit)) as net_income
	    from 
		cf_trial_balance tb
	    left join cf_trial_balance_mapping tbm
	    on tb.account_caption = tbm.account_caption
	     where tbm.account_type in ('revenue', 'expense')
	     and tb.access_slug=?
	     and tbm.access_slug=tb.access_slug
	     and tb.period_date = ?
	    `;

	let [ni_close] = await run_query(query, [req.query.access_slug, req.query.close_period]);
    let [ni_open] = await run_query(query, [req.query.access_slug, req.query.open_period]);

	let net_income = ni_close[0].net_income  - ni_open[0].net_income;

	//### RETAINED EARNINGS

	let re_h = {};
	re_h[req.query.close_period] = {debit: parseFloat(0), credit: parseFloat(0) };
	re_h[req.query.open_period] = {debit: parseFloat(0), credit: parseFloat(0) };


	query = `
	    select 
		tbm.account_type, sum(tb.debit) as debit_sum, sum(tb.credit) as credit_sum
	    from 
		cf_trial_balance tb, cf_trial_balance_mapping tbm
	     where tb.period_date = ?
	     and tb.account_caption = tbm.account_caption
	     and tbm.account_type in ('retained earnings')
	     and tb.access_slug=?
	     and tb.access_slug = tbm.access_slug
	    group by tbm.account_type`;

	let [closing_results] = await run_query(query, [req.query.close_period, req.query.access_slug]);


	for( i in closing_results)
	{
	    re_h[req.query.close_period]['debit'] 	=  parseFloat(re_h[req.query.close_period]['debit']) +  parseFloat(closing_results[i].debit_sum);
	    re_h[req.query.close_period]['credit'] 	=  parseFloat(re_h[req.query.close_period]['credit']) + parseFloat(closing_results[i].credit_sum);
	}

	let [opening_results] = await run_query(query, [req.query.open_period, req.query.access_slug]);


	for( i in opening_results)
	{
	    re_h[req.query.open_period]['debit'] 	= parseFloat(re_h[req.query.open_period]['debit']) + parseFloat(opening_results[i].debit_sum);
	    re_h[req.query.open_period]['credit']	= parseFloat(re_h[req.query.open_period]['credit']) +  parseFloat(opening_results[i].credit_sum);
	}

	let re_adjustment = ( re_h[req.query.close_period]['debit'] - re_h[req.query.open_period]['debit'] ) - ( re_h[req.query.close_period]['credit'] - re_h[req.query.open_period]['credit'] );
	let adjusted_net_income = parseFloat(net_income).toFixed(2) - parseFloat(re_adjustment).toFixed(2);

	//####### Change in cash

	query = `
	    select 
		DATE_FORMAT(tb.period_date,"%Y-%m-%d") period_date,sum(tb.debit) as debit_sum, sum(tb.credit) credit_sum 
	    from 
		cf_trial_balance tb, cf_trial_balance_mapping tbm
	    where 
		tb.period_date in (?, ?) 
		and tbm.account_type = "cash"
		and tb.account_caption = tbm.account_caption
		and tb.access_slug=?
		and tb.access_slug = tbm.access_slug
	    group by tb.period_date`;

	let [results] = await run_query(query, [req.query.open_period, req.query.close_period, req.query.access_slug]);

	let cash_balances = {};
	for( i in results )
	{
	    cash_balances[results[i].period_date] = results[i].debit_sum - results[i].credit_sum;
	}
	
	let change_in_cash = parseFloat(cash_balances[req.query.close_period]) - parseFloat(cash_balances[req.query.open_period]);

	query = `
	    select 
		scf.id, scf.caption_description, scf.section_type, CAST(sum(rv.rec_value) as DECIMAL(10,2)) scfrv
	    from 
		cf_rec_table rv, statement_of_cashflows scf
	    where 
		rv.open_period>=?
		and rv.close_period<=?
		and scf.id = rv.cashflow_caption_id
		and rv.access_slug=?
		and scf.section_type not in ('non-cash adjustment')
	    group by scf.caption_description`;

	[results] = await run_query(query, [req.query.open_period, req.query.close_period, req.query.access_slug]);
	var cashflow_recon = {};
	let total_recs = 0;
	let scf_ids = {};

	for( i in results )
	{
		cashflow_recon[results[i].section_type] = [];
	}

	for( i in results )
	{
		cashflow_recon[results[i].section_type].push({
			'caption_description': results[i].caption_description,
			'amount': parseFloat(results[i].scfrv),
                	'scf_id': results[i].id,
                	'open_period': req.query.open_period,
                	'close_period': req.query.close_period
		});
		total_recs += parseFloat(results[i].scfrv)
	}
	let cashflow_change_in_cash = adjusted_net_income + total_recs;


	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "Net Income", "Net Income", adjusted_net_income);
	//### OPERATIONS
	let cashflows_from_operations = 0;
	for( i in cashflow_recon['operating reconciliation'] )
	{
		cashflows_from_operations += parseFloat(cashflow_recon["operating reconciliation"][i]['amount']);
		insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "operating reconciliation", cashflow_recon["operating reconciliation"][i]['caption_description'], cashflow_recon["operating reconciliation"][i]['amount'] );
	}

	for( i in cashflow_recon['change in operating accounts'] )
	{
		cashflows_from_operations += parseFloat(cashflow_recon["change in operating accounts"][i]['amount']);
		insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "change in operating accounts", cashflow_recon["change in operating accounts"][i]['caption_description'], cashflow_recon["change in operating accounts"][i]['amount']);
	}

	let net_cashflows_from_operations = adjusted_net_income + cashflows_from_operations;

	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "net cashflows from operations", "Net cash provided by (used in) operating activities", net_cashflows_from_operations );

	//### INVESTING
	let cashflows_from_investing = 0;
	for( i in cashflow_recon['investing'] )
	{
	    cashflows_from_investing += parseFloat( parseFloat(cashflow_recon["investing"][i]['amount']) );
	    insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "investing", cashflow_recon["investing"][i]['caption_description'], cashflow_recon["investing"][i]['amount']);
	}
	
	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "net cashflows from investing", "Net cash provided by (used in) investing activities", cashflows_from_investing );

	//### FINANCING
	let cashflows_from_financing = 0;
	for( i in cashflow_recon["financing"] )
	{
	    cashflows_from_financing += parseFloat(cashflow_recon['financing'][i]['amount']);
	    insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "financing", cashflow_recon["financing"][i]['caption_description'], cashflow_recon["financing"][i]['amount'] );
	}
	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "net cashflows from financing", "Net cash provided by (used in) financing activities", cashflows_from_financing );

	let total_change_in_cash = net_cashflows_from_operations + cashflows_from_investing + cashflows_from_financing;
	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "total change in cash", "Net increase (decrease) in cash, cash equivalents and restricted cash", total_change_in_cash);

	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "Beginning of period", "Beginning of Period", cash_balances[req.query.open_period]);
	insert_compiled_scf(req.query.access_slug, req.query.open_period, req.query.close_period, "End of period", "End of Period", cash_balances[req.query.close_period]);

	//### Non-Cash Adjustment
        // For non-cash transactions, they clear in subsequent periods. so we only want to pull any non-cash reconciliations from the most recent reporting period.


	query = `select distinct period_date from cf_trial_balance where access_slug=? and period_date < ? order by period_date desc limit 1`;
	let previous_period = [];
	
	[previous_period] = await run_query(query, [req.query.access_slug, req.query.close_period]);

	if( previous_period.length < 1)
	{
		previous_period[0].period_date = req.query.close_period;
	}

	query = `
	    select 
		scf.section_type, tbm.account_caption, scf.caption_description, sum(crt.rec_value) as amount
	    from 
		cf_trial_balance_mapping tbm, cf_rec_table crt, statement_of_cashflows scf
	    where crt.close_period <= ?
	    and crt.open_period >= ? 
	    and tbm.id = crt.account_id
	    and scf.id = crt.cashflow_caption_id
	    and scf.section_type in ('non-cash adjustment')
	    and scf.access_slug=?
	    group by tbm.account_caption, scf.caption_description`;

	[results] = await run_query(query, [req.query.close_period, previous_period[0].period_date, req.query.access_slug]);
	let non_cash_adjustment_tot = 0;
	cashflow_recon['non-cash adjustment'] = [];	
	for( i in results )
	{
		cashflow_recon['non-cash adjustment'].push({
			'caption_description': results[i].caption_description,
			'amount': parseFloat(results[i].amount),
			'scf_id': results[i].id,
			'open_period': req.query.open_period,
			'close_period': req.query.close_period
		});
		non_cash_adjustment_tot += parseFloat( parseFloat(results[i].amount) );	    
		insert_compiled_scf(req.query.access_slug, previous_period[0].period_date, req.query.close_period, 'non-cash adjustment', results[i].caption_description, results[i].amount);
	}
	let data = {

		operating_reconciliation: cashflow_recon['operating reconciliation'],
		change_in_operating_accounts: cashflow_recon['change in operating accounts'],
		investing: cashflow_recon['investing'],
		financing: cashflow_recon["financing"],
		non_cash_adjustments: cashflow_recon["non-cash adjustment"],
		close_period: req.query.close_period,
		open_period: req.query.open_period,
		adjusted_net_income: adjusted_net_income,
		net_cashflows_from_operations: net_cashflows_from_operations,
		cashflows_from_investing: cashflows_from_investing,
		cashflows_from_financing: cashflows_from_financing,
		total_change_in_cash: total_change_in_cash,
		cashflow_change_in_cash: cashflow_change_in_cash,
		beginning_period_cash: cash_balances[req.query.open_period],
		ending_period_cash: cash_balances[req.query.close_period],
		change_in_cash: change_in_cash,

	};
	return data;

}


async function insert_compiled_scf( access_slug, open_period, close_period, scf_section, scf_caption, line_value)
{

        await run_query(`insert into cf_compiled_scf (access_slug, open_period, close_period, caption_section, caption_description, line_value) values (?, ?, ?, ?, ?, ?)`,
			[access_slug, open_period, close_period, scf_section, scf_caption, line_value]);

}


//if($ps->{upload_type} eq "trial_balance_coding")
async function save_trial_balance_coding(req, res, file_name)
{

	let query = `select account_caption from cf_trial_balance_mapping where access_slug=?`;
	let [results] = await run_query(query, [req.body.access_slug]);


	let account_list = {};
	for( i in results )
	{
		account_list[results[i].account_caption] = 1;
	}
	let insertQuery = `insert into cf_trial_balance_mapping (account_caption, account_type, access_slug) values (?, ?, ?)`;
	let updateQuery = `update cf_trial_balance_mapping set account_type=? where access_slug=? and account_caption=?`;

	fs.createReadStream("uploads/"+file_name).pipe(csv()).on('data', (row) => {

		for( i in row )
		{
			//get rid of all BOM marks read in from the CSV file
			e = i.replace(/^\uFEFF/, "");
			row[e] = row[i];
		}
		if( account_list[ row['account_caption'] ] > 0 )
		{
			run_query(updateQuery, [row.account_type, req.body.access_slug, row.account_caption]);
		} else {
			run_query(insertQuery, [row.account_caption, row.account_type, req.body.access_slug]);
		}

	
        }).on('end', () => {
		fs.unlink("uploads/" + file_name, ()=>{});
		res.send("Trial balance coding updated");
	}).on('error', (err) =>{
		console.log(err);
	});

}

async function save_trial_balance(req, res, file_name)
{
	await run_query('delete from cf_trial_balance where period_date=? and access_slug=?', [req.body.date, req.body.access_slug]);

	let trial_balance = [];
	fs.createReadStream("uploads/"+file_name).pipe(csv()).on('data', (row) => {

		for( i in row )
		{
			//get rid of all BOM (byte order marks) characters read in from the CSV file
			e = i.replace(/^\uFEFF/, "");
			row[e] = row[i];
		}

		trial_balance.push(row);

	}).on('end', () => {

		fs.unlink("uploads/" + file_name, ()=>{
			//delete record saved in the uploads directory - we don't need it.
		});

		//with the trial balance array populated, pass off the data to a function that will insert it.
		insert_trial_balance_records(req, res, trial_balance);

	}).on('error', (err) =>{
			console.log(err);
	});

}

async function insert_trial_balance_records(req, res, trial_balance)
{


 	let query = `select account_caption from cf_trial_balance_mapping where access_slug=?`;
	let [results] = await run_query(query, [req.body.access_slug]);

	let in_map = {};
	for( i in results )
	{
		in_map[ results[i].account_caption ] = 1;
	}

	let map_query = `insert into cf_trial_balance_mapping (account_caption, access_slug) values (?, ?)`;
	let tb_insert = `insert into cf_trial_balance (account_caption, period_date, debit, credit, access_slug) values (?, ?, ?, ?, ?)`;
	let debit_total = 0;
	let credit_total = 0;

	for( r in trial_balance)
	{

		//skip blank lines
		if( /^$/ig.test(trial_balance[r].account_caption ) )
			continue;


		row.debit = row.debit.replace(/"/g, '');
		row.debit = row.debit.replace(/'/g, '');
		row.debit = row.debit.replace(/\$/g, '');
		row.debit = row.debit.replace(/\£/g, '');
		row.debit = row.debit.replace(/\,/g, '');

		row.credit = row.credit.replace(/"/g, '');
		row.credit = row.credit.replace(/'/g, '');
		row.credit = row.credit.replace(/\$/g, '');
		row.credit = row.credit.replace(/\£/g, '');
		row.credit = row.credit.replace(/\,/g, '');

		//skip any rows that start with "total"
		if( /^total/ig.test(trial_balance[r].account_caption ))
			continue;

		//Make sure all new trial balance accounts are in the SCF map so they can be coded to a cashflow statement section.
		if( typeof in_map[ trial_balance[r].account_caption ] == "undefined" )
		{
			await run_query(map_query, [trial_balance[r].account_caption, req.body.access_slug]);
		}

		debit_total += parseFloat(trial_balance[r].debit);
		credit_total += parseFloat(trial_balance[r].credit);
	
		await run_query(tb_insert, [trial_balance[r].account_caption, req.body.date, trial_balance[r].debit, trial_balance[r].credit, req.body.access_slug ]);

	}

	res.send(`Trial balance posted<BR>Debits: ${debit_total} = Credits: ${credit_total}<BR><BR>`);

}

async function view_tb(req, res)
{
	
	let query = `select *,DATE_FORMAT(period_date, '%Y-%m-%d') as period_date from cf_trial_balance where period_date in (?, ?) and access_slug=?`;
	let [results] = await run_query(query, [req.query.open_period, req.query.close_period, req.query.access_slug] );


	let trial_balance = {};
	//iniitialize trial_balance structure
	//there has to be a better way
	for( i in results )
	{
		trial_balance[ results[i].account_caption ] = {};
	}

	for( i in results )
	{
		trial_balance[ results[i].account_caption ][ req.query.open_period ] = { debit: 0, credit: 0};
		trial_balance[ results[i].account_caption ][ req.query.close_period ] = { debit: 0, credit: 0};
	}

	for( i in results )
	{

		trial_balance[results[i].account_caption][ results[i].period_date]['debit'] = results[i].debit;
		trial_balance[results[i].account_caption][ results[i].period_date]['credit'] = results[i].credit;
	}


	let main_content = `
	<title>Trial Balances</title>
	<script src="csv.js"></script>
	<center>
	<p class=poppins_font style="font-size:30px;">Trial Balance</p>
	<a href="javascript:exportTableToCSV('tb_table', 'trial_balance.csv');" class="btn btn-dark"><i class="fa-solid fa-file-csv"></i> Download</a><BR><BR>
	<div style="width:90%">
	<table class=table border=1 id=tb_table>
	<thead>
	<tr>
			<td></td>
			<td colspan=2 align=center>${req.query.open_period}</td>
			<td colspan=2 align=center>${req.query.close_period}</td>
	</tr>
	<tr>
			<td>Account</td>
			<td align=center>Debit</td>
			<td align=center>Credit</td>
			<td align=center>Debit</td>
			<td align=center>Credit</td>
	</tr>
	</thead>`;

	for( i in trial_balance )
	{

		let open_debit = trial_balance[i][req.query.open_period]['debit'];
		let open_credit = trial_balance[i][req.query.open_period]['credit'];
		let close_debit = trial_balance[i][req.query.close_period]['debit'];
		let close_credit = trial_balance[i][req.query.close_period]['credit'];
	

		main_content += `
		<tr>
				<td>${i}</td>
				<td align=right><div class=comma>${ open_debit }</div></td>
				<td align=right><div class=comma>${ open_credit }</div></td>
				<td align=right><div class=comma>${ close_debit }</div></td>
				<td align=right><div class=comma>${ close_credit }</div></td>
		</tr>`;

	}
        
	main_content += `
        </table></div>
        </center>`;

	res.send(main_content);
}

async function save_new_cashflow_captions(req, res, file_name)
{
	
	let query = `insert into statement_of_cashflows (caption_description, section_type, access_slug) values (?, ?, ?)`;

	let available_types = {};
	available_types['operating reconciliation'] = 1;
	available_types['change in operating accounts'] = 1;
	available_types['non-cash adjustment'] = 1;
	available_types['investing'] = 1;
	available_types['financing'] = 1;

	let return_string = `<div style="width:30%"><table class=table><tr><td>Caption Description</td><td>Section Type</td></tr>`;

 	fs.createReadStream("uploads/"+file_name).pipe(csv()).on('data', (row) => {

		for( i in row )
		{
				//get rid of all BOM marks read in from the CSV file
				e = i.replace(/^\uFEFF/, "");
				row[e] = row[i];
		}
		if( available_types[ row['section_type'] ] > 0 )
		{
			run_query(query, [row.caption_description, row.section_type, req.body.access_slug]);
		} else {
			//section wasn't found - by default assign it to operating reconciliation
			run_query(query, [row.caption_description, 'operating reconciliation', req.body.access_slug]);
		}

		return_string += `<tr><td>${row.caption_description}</td><td align=right>${row.section_type}</td></tr>`;

	}).on('end', () => {
			fs.unlink("uploads/" + file_name, ()=>{});
	return_string += "</table></div>";
			res.send(return_string);
	}).on('error', (err) =>{
			console.log(err);
	});

}

async function export_all_data(req, res)
{

	let query = `select id, account_caption, DATE_FORMAT(period_date, "%Y-%m-%d") period_date, debit, credit, access_slug from  cf_trial_balance where access_slug=?`;
	let [results] = await run_query(query,[req.query.access_slug]);
	let tb = [];
	for( i in results )
	{
	    tb.push( results[i] )
	}

	query = `select
			rt.id, rt.cashflow_caption_id, rt.cashflow_caption, DATE_FORMAT(rt.open_period, "%Y-%m-%d") open_period, DATE_FORMAT(rt.close_period, "%Y-%m-%d") close_period, rt.rec_value, rt.account_id, rt.access_slug, scf.caption_description,tbm.account_caption
		    from
			cf_rec_table rt, statement_of_cashflows scf, cf_trial_balance_mapping tbm
		    where
			rt.account_id = tbm.id
			and rt.cashflow_caption_id = scf.id
			and rt.access_slug=?
	`;

	[results] = await run_query(query,[req.query.access_slug]);

	let rt = [];
	for( i in results )
	{
		rt.push( results[i] )
	}

	query = `select * from cf_trial_balance_mapping where access_slug=?`;
	[results] = await run_query(query,[req.query.access_slug]);


	let tbm = [];
	for( i in results )
	{
		tbm.push( results[i] )
	}
	
	query = `select * from statement_of_cashflows where access_slug=?`;
	[results] = await run_query(query,[req.query.access_slug]);
	let captions = [];
	for( i in results )
	{
		captions.push( results[i] )
	}

	query =`select id, account_id, cashflow_caption_id, DATE_FORMAT(open_period,"%Y-%m-%d") open_period, DATE_FORMAT(close_period, "%Y-%m-%d") close_period, note_text, access_slug from cf_reconciliation_notes where access_slug=?`;
	[results] = await run_query(query,[req.query.access_slug]);

	let notes = [];
	for( i in results )
	{
		notes.push(results[i]);
	}

	res.setHeader('content-type','application/x-download');
	res.setHeader('content-disposition',`attachment;filename=${req.query.access_slug}-backup.json`);
	res.send(JSON.stringify({trial_balance:tb, trial_balance_mapping:tbm, cashflow_captions:captions, rec_table: rt, reconciliation_notes:notes}));
	
}


async function restore_from_backup(req, res, file_name)
{
	let backup_json = '';
	fs.readFile('uploads/'+file_name, 'utf8', (err,data) => {
		insert_from_backup(req,res,data);
		fs.unlink('uploads/' + file_name, ()=>{});
	});
}

async function insert_from_backup(req, res, data)
{
	let json = JSON.parse(data);
	res.send("Restored");

	await run_query(`delete from statement_of_cashflows where access_slug=?`,[req.body.access_slug]);
	await run_query(`delete from cf_rec_table where access_slug=?`,[req.body.access_slug]);
	await run_query(`delete from cf_trial_balance where access_slug=?`,[req.body.access_slug]);
	await run_query(`delete from cf_trial_balance_mapping where access_slug=?`,[req.body.access_slug]);
	await run_query(`delete from cf_reconciliation_notes where access_slug=?`,[req.body.access_slug]);

    //### CASHFLOW CAPTIONS

	let query = `insert into statement_of_cashflows (caption_description, section_type, access_slug) values (?, ?, ?)`;
	let original_cashflow_caption_ids = {};
	for (i in json['cashflow_captions'] )
	{
		await run_query(query,  [ json['cashflow_captions'][i].caption_description, json['cashflow_captions'][i].section_type, req.body.access_slug   ], 'insert_from_backup', 'insert into statement_of_cashflows');
                original_cashflow_caption_ids[ json['cashflow_captions'][i].id ] = json['cashflow_captions'][i].caption_description;
	}

	query = `select * from statement_of_cashflows where access_slug=?`;
	let [results] = await run_query( query , [req.body.access_slug]);
	let cashflow_caption_ids = {};
	for( i in results )
	{
		cashflow_caption_ids[ results[i].caption_description ] = results[i].id;
	}

	//### TRIAL BALANCE

	query = `insert into cf_trial_balance (account_caption, period_date, debit, credit, access_slug) values (?, DATE_FORMAT(?, "%Y-%m-%d"), ?, ?, ?)`;
	for( i in json['trial_balance'] )
	{
		await run_query(query, [json['trial_balance'][i].account_caption, json['trial_balance'][i].period_date, json['trial_balance'][i].debit, json['trial_balance'][i].credit, req.body.access_slug ], 'insert_from_backup', 'insert trial_balance');
	}

	//### TRIAL BALANCE MAPPING

	query = `insert into cf_trial_balance_mapping (account_caption, account_type, access_slug) values (?, ?, ?)`;
	let original_account_ids = {};
	for (i in json['trial_balance_mapping'] )
	{
		await run_query(query, [ json['trial_balance_mapping'][i].account_caption, json['trial_balance_mapping'][i].account_type, req.body.access_slug ], 'insert_from_backup', 'cf_trial_balance_mapping' );
		original_account_ids[ json['trial_balance_mapping'][i].id ] = json['trial_balance_mapping'][i].account_caption;
	}

	//#get new account IDs since they have been updated with auto_increment
	query = `select * from cf_trial_balance_mapping where access_slug=?`;
	[results] = await run_query(query, [req.body.access_slug]);
	let account_ids = {};
	for( i in results )
	{
		account_ids[results[i].account_caption] = results[i].id;
	}
    //### REC TABLE
	query = `insert into cf_rec_table (cashflow_caption_id, open_period, close_period, rec_value, account_id, access_slug) values (?, ?, ?, ?, ?, ?)`;
	for( i in json['rec_table'] )
	{
		await run_query(query, [
			cashflow_caption_ids[ json['rec_table'][i].caption_description ],
			json['rec_table'][i].open_period,
			json['rec_table'][i].close_period,
			json['rec_table'][i].rec_value,
			account_ids[ json['rec_table'][i].account_caption ],
			req.body.access_slug
		], 'insert_from_backup', 'insert cf_rec_table' );
	}

	//### REC NOTES

	query = `insert into cf_reconciliation_notes (account_id, cashflow_caption_id, open_period, close_period, note_text, access_slug) values (?, ?, ?, ?, ?, ?)`;
	for( i in json['reconciliation_notes'] )
	{

	await run_query(query, [
			account_ids[ original_account_ids[ json['reconciliation_notes'][i].account_id ] ],
			cashflow_caption_ids[ original_cashflow_caption_ids[ json['reconciliation_notes'][i].cashflow_caption_id ] ],
			json['reconciliation_notes'][i].open_period,
			json['reconciliation_notes'][i].close_period,
			json['reconciliation_notes'][i].note_text,
			req.body.access_slug
		], 'insert_from_backup', 'insert reconciliation notes' );
	}

}


async function prepare_consolidating_scf(req, res)
{

	let access_slugs = req.query.access_slugs.split(",");

	var q = Array(access_slugs.length + 1).join("?,").replace(/(,$)/, "");
	console.log(q);

	let query = `select * from cf_compiled_scf where access_slug in (${q}) and open_period>=? and close_period<=?`;
	let inputs = [];
	for( s in access_slugs)
	{
		inputs.push(access_slugs[s]);
	}
	inputs.push(req.query.open_period, req.query.close_period);

	let [results] = await run_query(query, inputs);	

	let cashflow_statement = {};

	for(i in results)
	{
		cashflow_statement[ results[i].caption_section ] = {};	
	}
	for(i in results)
	{
			cashflow_statement[ results[i].caption_section ][ results[i].caption_description ] = {};
	}

	for(i in results)
	{
			cashflow_statement[ results[i].caption_section ][ results[i].caption_description ][ results[i].access_slug ] = 0;
	}

	for(i in results)
	{
			cashflow_statement[ results[i].caption_section ][ results[i].caption_description ][ results[i].access_slug ] = parseFloat(results[i].line_value);
	}
	app.engine('html', engines.ejs);	
	let m_obj = {open_period: req.query.open_period, close_period: req.query.close_period, cashflow_statement: cashflow_statement, access_slugs: access_slugs};
	res.render('consolidating_statement_of_cashflows', m_obj);


}


async function run_query(query, inputs, c_aller, request_description)
{
	const db = await pool.getConnection();
	let results =[];
	try {
		
		results = await db.execute(query, inputs);
	} catch(e) {
		//await db.execute(`insert into error_log (caller, request_description, stack_error, error_timestamp, inputs, query) values (?, ?, ?, now(), ?, ?)`, [c_aller, request_description, e.toString(), inputs, query]);
		console.log(e);
		console.log(inputs);
	}
	db.release();
	return results;
}


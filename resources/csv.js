function exportTableToCSV(table_id, filename) {
	var csv = [];
    	var detail_table = document.getElementById(table_id);
    	var rows = detail_table.querySelectorAll('tr');

    	let headers = []; 
    	let h_cols = rows[0].querySelectorAll("td, th");
    	for (var h = 0; h < h_cols.length; h++)
        	headers.push(h_cols[h].innerText);

	csv.push(headers.join(","));
 
    	for (var i = 1; i < rows.length; i++) {
 		var row = []
		let cols = rows[i].querySelectorAll("td, th");
        
        	for (var j = 0; j < cols.length; j++) 
            		row.push('"'+cols[j].innerText+'"');
        
       	 	csv.push(row.join(","));        
    	}

    	// Download CSV file
	downloadCSV(csv.join("\n"), filename);
}


function downloadCSV(csv, filename) {
    	var csvFile;
    	var downloadLink;

    	// CSV file
    	csvFile = new Blob(["\ufeff",csv], {type: "text/csv"});

    	// Download link
    	downloadLink = document.createElement("a");

    	// File name
    	downloadLink.download = filename;

    	// Create a link to the file
    	downloadLink.href = window.URL.createObjectURL(csvFile);

    	// Hide download link
    	downloadLink.style.display = "none";

    	// Add the link to DOM
    	document.body.appendChild(downloadLink);

    	// Click download link
    	downloadLink.click();
}

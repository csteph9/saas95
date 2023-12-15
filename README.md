[![SaaS95 Logo](http://saas95.com/saas95.png)](http://saas95.com/)

# The Statement of Cashflows (US GAAP ASC 230, fka SFAS No. 95)

The Statement of Cashflows prepared on an indirect basis is ubiquitous. It is filed by every public company in the quarterly 10-Q and annual 10-K financial statements.  Also, private companies who are audited must prepare this statement as part of their periodic reporting.

SaaS95 is an application that enables financial reporting practitioners to prepare this indirect Statement of Cashflows in conformity with US GAAP. 

Most ERP systems pretend to address the Statement of Cashflows. They either offer overly complicated report-writer functionality needing a computer science degree to manage & maintain or they don’t even pretend at all. In either case, the inevitable “spreadsheet” method ensues.

The Statement of Cashflows is arguably the most complicated statement to prepare compared to the other 3 core required statements: the statement of position, the statement of operations, and the statement of shareholder's equity. The Statement of Cashflows presents financial transactions from these other three statements in unintuitive ways that reconcile net income to the change in cash and cash equivalents. As a result of this complexity, inflexibility, errors, and single-track work methods are unintended consequences.

SaaS95 addresses the preparation of this statement in a structured way that allows flexibility and bypasses the spreadsheet. A great analogy would be bowling with and without bumpers. SaaS95 gives practitioners bumper rails when preparing their Statement of Cashflows. Preparation becomes trivial with bumpers.

# Licensing
SaaS95 is licensed under the [Creative Commons Non-Commercial 4.0 deed](https://creativecommons.org/licenses/by-nc/4.0/deed.en). Practitioners and their teams are free to download, implement, modify, redistribute, and benefit from SaaS95. SaaS95 shall not be exploited by services, however, for commercial hosting endeavors. Expertise-based consulting and implementation services are outside the scope of SaaS95’s license.

# Installation
SaaS95 is built using NodeJS and Mysql (or MariaDB).

Download and install [NodeJS](https://nodejs.org/en/).

Download and install [MariaDB](https://mariadb.com/downloads/). Make sure you set & remember your root password. You'll need it for subsequent steps.

[Download](https://github.com/csteph9/saas95/archive/refs/heads/main.zip) the SaaS95 code base from GitHub, or clone the repo using [git](https://git-scm.com/downloads)

```console
$ git clone https://github.com/csteph9/saas95.git
```

Create your MariaDB SaaS95 database:
```console
$ mysqladmin -u root -p create saas95
```

Set SaaS95 user credentials and initialize the database:
```console
$ mysql saas95 -u root -p
Enter Password: ******
mysql> GRANT ALL PRIVILEGES ON saas95.* TO 'me'@localhost IDENTIFIED BY 'my_password';
mysql>\. mysql_schema.sql
```

Next, use npm (included with node) to install all of the required NodeJS modules required by SaaS95. Note when executing this command, you should be in the folder that has the package.json file.

```console
$ npm install
```

Open up configs.js in your text editor (notepad, textedit, etc.) and update it to match your MariaDB database parameters:
```js
const host = 'localhost';
const database = 'saas95'; // set to the databse you created
const user = 'me'; //should match what you set above
const password = 'my_password'; //should match what you set above.


const site_url = 'localhost'; // leave this as-is if your running saas95 from your local device. If you are setting up in EC2 or other cloud platform, use the URL where the application will be accessed.
const port = 3000;
```

Finally, launch the application and use SaaS95.
```console
$ npm run app
[nodemon] starting `node app.js`
SaaS95 running; view at localhost:3000/main.html
```

See the Getting Started User guide [here](https://saas95.com/getting_started.pl).

# Start with an example

See [saas95/example](https://github.com/csteph9/saas95/tree/main/example) for a test file you can test with and some UI screenshots.


function introjs_init(){

        if( stop_introjs )
        {
                return;
        }
        if( introjs_page == "")
        {
                introJs().setOptions({
                        steps: [
                                {
                                        title: 'Welcome',
                                        intro: 'Get started using SaaS95. Follow along with this quick intro to get started. Click Next >>'
                                },
                                {
                                        element: document.getElementById('cf_slug'),
                                        intro: 'Get started by putting in your access key. You can set this to whatever you like, just remember it. Use a simple naming convension like FY26. or 3Q24.'
                                },
                                {
                                title: 'Trial Balances',
                                element: document.getElementById('data_manager'),
                                intro: 'Next, head over to the Trial Balance DB manager to upload your trial balances!'
                                },
                                {
                                        title: 'Trial Balance Mapping',
                                        element: document.getElementById('data_manager'),
                                        intro: 'With your trial balances loaded, make sure you map your account captions - this powers your SCF. Everytime you upload a trial balance, make sure your mapping is updated and complete.'
                                },
                                {
                                        title: 'Cashflow Captions',
                                        element: document.getElementById('data_manager'),
                                        intro: 'Build out your cashflow captions for your statement of cashflows here. This is where you design what captions show up on your SCF.'
                                },
                                {
                                        title: 'Update the periods for reconciliation',
                                        element: document.getElementById('introjs_loadrec'),
                                        intro: 'Set your opening and ending dates and load your reconcliation.'
                                },
                                {
                                        title: 'Help!!!',
                                        element: document.getElementById('introjs_help'),
                                        intro: 'Any time you need help on any page, just click this button for a walk-through.'
                                }
                        ]
                }).start();
        }
        if( introjs_page == "import_tb")
        {
                introJs().setOptions({
                        steps: [{
                                title: 'Manage your trial balances',
                                intro: 'Import your trial balance on this page. You can also set your open and close periods directly from periods loaded. Note that you can replace a period\'s trial balance at any time, it is non-destructive. Your reconciliations will be saved, and if any numbers are updated after reloading, will be available to re-reconcile.'
                        }

                        ]
                }).start();
        }
        if( introjs_page == "load_scf")
        {
                introJs().setOptions({
                        steps: [{
                                title: 'Reconciling Deltas',
                                element: document.getElementById('introjs_deltas'),
                                intro: 'Deltas you need to reconcile are shown in this column'
                        },
                        {
                                title: 'Click here',
                                element: document.getElementById('introjs_recbutton'),
                                intro: 'Clicking this button opens up your reconciliation for this account. Once a button turns green, congrats, you\'re done!'
                        }

                        ]
                }).start();
        }
        if( introjs_page == "load_trial_balance")
        {
                introJs().setOptions({
                        steps: [{
                                title: 'Trial Balance Mapping',
                                element: document.getElementById('introjs_tbm'),
                                intro: 'This page shows all of the trial balance accounts that have been imported. Set their natural account type in the dropdown.'
                        }

                        ]
                }).start();
        }
        if( introjs_page == "scf_captions")
        {
                introJs().setOptions({
                        steps: [{
                                title: 'Cashflow Captions',
                                element: document.getElementById('introjs_scf'),
                                intro: 'Define your statement of cashflow captions on this page. These captions must be populated to reconcile account differences.'
                        },
                        {
                                title: 'Statement Section',
                                element: document.getElementById('introjs_scf_section'),
                                intro: 'Define the section of the cashflow statement for each caption.'
                        },
                        {
                                title: 'Edit Captions',
                                element: document.getElementById('introjs_scf_section_edit'),
                                intro: 'You can edit already populated captions here. Your statement of cashflows will be automatically kept updated.'
                        },
                        {
                                title: 'Delete Captions',
                                element: document.getElementById('introjs_scf_section_delete'),
                                intro: 'You can only delete a caption if it is not in use. Find in use captions by loading the reconciliation and identifying which periods use the caption. Change the reconciliation to a different classification.'
                        }

                        ]
                }).start();
        }
        if( introjs_page == "settings")
        {
                introJs().setOptions({
                        steps: [{
                                title: 'Download Backup File',
                                element: document.getElementById('settings_download'),
                                intro: 'If you have completed a period\'s SCF, you should download & backup your work.'
                        },
                        {
                                title: 'Restore from Backup',
                                element: document.getElementById('settings_restore'),
                                intro: 'You can restore all data for an access key by uploading a previously downloaded backup file. Note this will replace all data in the access key. It is recommended that every time you complete a SCF reconciliation, you download your backup file, and then delete all data for the access key.'
                        },
                        {
                                title: 'Delete All Data',
                                element: document.getElementById('settings_delete_all_data'),
                                intro: 'This button removes all data stored on saas95 for the access key. It is recommended that you delete all data every time you have completed a SCF reconciliation and have backed it up. SaaS95 does not maintain backups, so if your data is lost, it will have to be recreated.'
                        }

                        ]
                }).start();
        }
        //introjs_page = "";
        document.cookie = "introjs=1";

}


/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record'],

    /**
    * @param {currentRecord} currentRecord
    * @param {record} record
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
    */

    function(currentRecord, record) {
        
          //filters sales orders by customer
        function filterCustomers (event) {
            let url = window.location.href;
            let urlBase = findBaseUrl(url);
            let currentRec = currentRecord.get();
            let customers = currentRec.getValue({
                fieldId: 'custpage_multiselect'
            });
    
            /** handles error if user clicks Customer Filter button, without 
                selecting customers. */
            if (customers[0] === ''){
                window.location.href = urlBase + '&customers_filtered=AAA';
            }

            else{
                customers = customers.join(',');
                window.onbeforeunload = null;
                window.location.href = urlBase + '&customers_filtered=' + customers;
            }
        }
        

        /** Error handling when user clicks Invoice All button without having checked any sales orders to invoice*/
        
        //<>get base url from cust-record<><>**************
        function noSelections (event) {
            // let url = window.location.href;
            // console.log('url = ' + url);

            const fetchSuiteletUrl = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });

            let suiteletUrl = fetchSuiteletUrl.getValue({
                fieldId : 'custrecord_suitlet_base_url'
            });
            console.log('suitletURL = ' + suiteletUrl)


            let currentRec = currentRecord.get();
            let hiddenCustIds = currentRec.getValue({
                fieldId: 'custpage_hidden_cust_filter'
            });
            if (hiddenCustIds === undefined){
                window.location.href = suiteletUrl;
            }
                
            else {
                if (hiddenCustIds === ''){
                    window.location.href = suiteletUrl;
                }
                //Allows any filtered customer id's to persist, when button clicked to return to start page, after Invoice All button clicked with no SO's checked
                else {
                    hiddenCustIds = hiddenCustIds.replaceAll('\u0005',',');           
                    window.location.href = suiteletUrl + '&customers_filtered=' + hiddenCustIds
                }

            }
        }
    

        //clears customer multi-select (built-in Reset button didn't work).
        function clearCustomers (event) {
            let url = window.location.href;
            let urlBase = findBaseUrl(url);
            console.log('urlBase', urlBase);
            window.location.href = urlBase
        }

        // helper fuction to establish suitelet landingpage Url
        // <><><><><>need to find a way of dealing with the noSelection button where url is :  https://304495-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl
        // when need to set window.location.href to https://304495-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1157&deploy=1
        function findBaseUrl(url){

            let l = 0;
            let r = 7;
            let equalSign = 0
            let baseUrl = ''
            let flag = true
            while (flag) {
        
                if (url.slice(l,r) === 'deploy='){
                    baseUrl = url.slice(l,r)
                    equalSign = r
                    flag = false
                }
                else{
                    // console.log('url.slice(else block = ' + url.slice(l,r))
                    l+=1;
                    r+=1;
                }
            }
        
            console.log('baseUrl if block = ' + baseUrl)
            console.log('equalSign = ' + equalSign)
        
            flag = true
            while (flag) {
        
        
                if (url[equalSign] === '&'){
                    url = url.slice(0, equalSign)
                    flag = false
                }
                
                else if (equalSign > url.length){
                    url = url
                    flag = false
                }
        
                equalSign +=1
            }
            console.log('URL', url);
            return url;
        
        }
        


    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function pageInit(scriptContext) {
        }

    return {
        pageInit: pageInit,
        filterCustomers : filterCustomers,
        noSelections : noSelections,
        clearCustomers : clearCustomers,
        findBaseUrl : findBaseUrl
        };
    
    });

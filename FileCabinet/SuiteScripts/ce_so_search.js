/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

// Purpose of Suitelet is to invoice any selected sales orders (which can be filtered by customers (multiselect) and individual sales order (checkbox))

define(['N/file', 'N/render', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/task', 'N/url', 'N/runtime', '/SuiteScripts/CE_Support_Module'],
 /**
 * @param {file} file
 * @param {render} render
 * @param {search} search
 * @param {record} record
 * @param {serverWidget} serverWidget
 * @param {task} task
 * @param {url} url
 * @param {runtime} runtime
 * @param {Object} context
 * @param {ServerRequest} context.request - Incoming request
 * @param {ServerResponse} context.response - Suitelet response
 */

    (file, render, search, record, serverWidget, task, url, runtime, sm) => {

        const onRequest = (context) => {            
            const request = context.request;
            const response = context.response;
            
            if (request.method == 'GET'){

                let mrTask = request.parameters.mr_task_id;
                
                if (mrTask){ //checks if map/reduce has started running

                    let statusOfMr = task.checkStatus({
                        taskId: mrTask
                    });

                    // writes final invoice page
                    if (statusOfMr.status === 'COMPLETE'){   
                        const finalInvoiceForm = sm.initializeFinalForm();
                        // const invoiceData = sm.getInvoiceData();
                        //<>want to break up final form so I can add get invoice data line above
                        sm.populateFinalSublist(finalInvoiceForm);
                        //<>
                        
                        sm.mrProcessingComplete(response);
                    }
                    else {  //writes invoice still processing page
                        sm.mrStillProcessing(statusOfMr, response)
                    }
                }
                else{  //Writes landing page
                    
                    //initializes landing page form
                    const invoiceForm = sm.initializeForm(context, request);

                    //gathers data for landing page form
                    const salesOrderData = sm.getData(request);

                    // populates landing page form
                    sm.populateLandingForm(invoiceForm, request, salesOrderData);

                    //writes landing page form
                    response.writePage({
                        pageObject: invoiceForm
                    });
                }
            }

            else {  //POST Request

                //prepares data from landing page form for and running Map/Reduce task
                let selectedSalesOrders = request.parameters.custpage_sales_ordersdata;
                let soData = sm.salesOrderSelectionData(selectedSalesOrders);               
                
                //runs map/reduce
                sm.runMapReduce(soData.soIdAndNumber);
    
            }
        }

        



        return {onRequest}
    }
);


/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/query', 'N/record', 'N/runtime'],
    /**
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 */
    (query, record, runtime) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

       
        //Purpose is to invoice sales orders (filtered by customer and number in suitelet)


        //gets array [sales order ids, sales order numbers] for invoicing from Suitelet
        const getInputData = (inputContext) => {

            const salesOrderIdAndNum = runtime.getCurrentScript().getParameter({
                name: 'custscript_so_num_id_object'
                }) 
                
            //clears old data from custom record before invoicing new batch
            const custRecClear = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });
            custRecClear.setValue({
                fieldId : 'custrecord_ce_invoice_data',
                value : '[]'
            })
            custRecClear.save();

            return JSON.parse(salesOrderIdAndNum)  
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */


        // creates invoice for each selected sales order.
        const map = (mapContext) => {
           try{
                let salesOrderIdWithNum = JSON.parse(mapContext.value);
                log.debug('salesOrderIdWithNum', salesOrderIdWithNum)

                let invoicing = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: salesOrderIdWithNum[0],
                toType: record.Type.INVOICE,
                isDynamic: true
                }); 

                let invoiceId = invoicing.save({
                    enableSourcing:true,
                });

                // gathers and saves data to cust record for suitelet final page
                //  (sales order number/id + invoice number/id)

                let invoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id : invoiceId,
                    isDynamic : true
                })
                let invoiceNum = invoiceRecord.getValue({
                    fieldId: 'tranid'
                })
                let idInvoice = invoiceRecord.getValue({
                    fieldId: 'id'
                })
                
                let SoAndInvoiceNumber = {'pair' : [salesOrderIdWithNum[1], parseInt(invoiceNum), parseInt(idInvoice), salesOrderIdWithNum[0]]}

                const invMrResults = record.load({
                    type : 'customrecord_ce_inv_mr_results',
                    id: 1
                });

                let salesOrderAndInvoiceNumbers = invMrResults.getValue({
                    fieldId : 'custrecord_ce_invoice_data'
                });
                salesOrderAndInvoiceNumbers = JSON.parse(salesOrderAndInvoiceNumbers)
                salesOrderAndInvoiceNumbers.push(SoAndInvoiceNumber)
                salesOrderAndInvoiceNumbers = JSON.stringify(salesOrderAndInvoiceNumbers)

                invMrResults.setValue({
                    fieldId : 'custrecord_ce_invoice_data',
                    value : salesOrderAndInvoiceNumbers
                })

                invMrResults.save();

            }
            catch (e) {
                log.error({
                    title: 'map error',
                    details: JSON.stringify(e)
                })
            } 
        }     
        

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */

        const reduce = (reduceContext) => {
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
        }

        return {getInputData, map}

    });


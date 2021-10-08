import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import axios from "axios"

const appSizes = {
    "S": {
        NodeCount: 2,
        vCoreCount: 2
    },
    "M": {
        NodeCount: 4,
        vCoreCount: 4
    },
    "L": {
        NodeCount: 8,
        vCoreCount: 8
    },
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    
    const inputSize = req.query.size;

    const size = appSizes[inputSize];

    const nodePriceQuery = await axios.get<any>("https://prices.azure.com/api/retail/prices?currencyCode=EUR&$filter=serviceName eq 'Virtual Machines' and armRegionName eq 'westeurope' and skuName eq 'F8s v2'");
    const nodePrice = (nodePriceQuery.data.Items as any[]).find(
        x => x.type === 'Consumption' && x.productName === 'Virtual Machines FSv2 Series')?.retailPrice;

    const sqlvCorePriceQuery = await axios.get<any>("https://prices.azure.com/api/retail/prices?currencyCode=EUR&$filter= armRegionName eq 'westeurope' and serviceName eq 'SQL Database'");
    const sqlvCorePrice = (sqlvCorePriceQuery.data.Items as any[]).find(
        x => x.type === 'Consumption' 
            && x.productName === 'SQL Database Single/Elastic Pool General Purpose - Compute Gen5'
            && x.skuName === size.vCoreCount + ' vCore')?.retailPrice;

    const nodeEstimate = size.NodeCount * nodePrice  * 24 * 30;
    const sqlEstimate = sqlvCorePrice  * 24 * 30;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: {
            nodeEstimate,
            sqlEstimate,
            total: nodeEstimate + sqlEstimate
        }
    };

};

export default httpTrigger;
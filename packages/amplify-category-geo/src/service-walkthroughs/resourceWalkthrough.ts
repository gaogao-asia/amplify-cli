import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import inquirer from "inquirer";
import { ServiceName, choosePricingPlan } from "../service-utils/constants";
import { PricingPlan } from "../service-utils/resourceParams";
import { $TSContext } from "amplify-cli-core";

export async function resourceAccessWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const accessChoices = [
        { name: 'Authorized users only', value: AccessType.AuthorizedUsers },
        { name: 'Authorized and Guest users', value: AccessType.AuthorizedAndGuestUsers }
    ];

    const accessPrompt = {
        type: 'list',
        name: 'accessType',
        message: `Who can access this ${getServiceFriendlyName(service)}?`,
        choices: accessChoices,
        default: parameters.accessType ? parameters.accessType : AccessType.AuthorizedUsers
    };
    return await inquirer.prompt([accessPrompt]);
};

export async function pricingPlanWalkthrough<T extends ResourceParameters>(
    context: $TSContext,
    parameters: Partial<T>
): Promise<Partial<T>> {
    let pricingPlan: PricingPlan = parameters.pricingPlan ? parameters.pricingPlan : PricingPlan.RequestBasedUsage;

    context.print.info(choosePricingPlan);

    const pricingPlanBusinessTypeChoices = [
        { name: 'No, I only need to track consumers personal mobile devices', value: false },
        { name: 'Yes, I track commercial assets (For example, any mobile object that is tracked by a company in support of its business)', value: true }
    ];
    const pricingPlanBusinessTypePrompt = {
        type: 'list',
        name: 'pricingPlanBusinessType',
        message: 'Are you tracking commercial assets for your business in your app?',
        choices: pricingPlanBusinessTypeChoices,
        default: pricingPlan === PricingPlan.RequestBasedUsage ? false : true
    };

    const pricingPlanBusinessTypeChoice = ((await inquirer.prompt([pricingPlanBusinessTypePrompt])).pricingPlanBusinessType as boolean);
    if (pricingPlanBusinessTypeChoice === false) {
        pricingPlan = PricingPlan.RequestBasedUsage;
    }
    else {
        const pricingPlanRoutingChoice = await context.amplify.confirmPrompt(
            'Does your app provide routing or route optimization for commercial assets?',
            pricingPlan === PricingPlan.MobileAssetManagement ? true : false
        );
        pricingPlan = pricingPlanRoutingChoice ? PricingPlan.MobileAssetManagement : PricingPlan.MobileAssetTracking;
    }
    parameters.pricingPlan = pricingPlan;

    context.print.info(`Successfully set ${pricingPlan} pricing plan for your Geo resources.`);
    return parameters;
};

export async function dataProviderWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const dataProviderPrompt = {
        type: 'list',
        name: 'dataProvider',
        message: `Specify the data provider of geospatial data for this ${getServiceFriendlyName(service)}:`,
        choices: Object.values(DataProvider),
        default: parameters.dataProvider ? parameters.dataProvider : 'Esri'
    };
    return await inquirer.prompt([dataProviderPrompt]);
};

const getServiceFriendlyName = (service: ServiceName): string => {
    switch(service) {
        case ServiceName.PlaceIndex:
            return 'Search Index';
        default:
            return service;
    }
};

const NewListingPages = require('../../pages/ListingPages/NewListingPages');
const TruckInIndia = require('../../pages/Homepage/TruckInIndia');
const ElectricCommercialVehicles = require('../../pages/Homepage/ElectricCommercialVehicles');
const LatestModelsByCategory = require('../../pages/Homepage/LatestModelsByCategory');
const CompareTrucks = require('../../pages/Compare/CompareTrucks');
const Brochure = require('../../pages/Brochure/Brochure');
const ElectricVehicle = require('../../pages/CategoryPages/ElectricVehicle');
const BuyUsedTrucks = require('../../pages/UsedTruck/BuyUsedTrucks');
const CvPermit = require('../../pages/UsedTruck/CvPermit');
const VehicleReport = require('../../pages/UsedTruck/VehicleReport');
const EChallan = require('../../pages/UsedTruck/EChallan');
const UsedTruckPdp = require('../../pages/UsedTruck/UsedTruckPdp');
const BusPdp = require('../../pages/Buses/BusPdp');
const TabbedModelOffers = require('../../pages/UtilityPages/TabbedModelOffers');
const Tyres = require('../../pages/UtilityPages/Tyres');
const BodyMakers = require('../../pages/UtilityPages/BodyMakers');
const ContactUs = require('../../pages/UtilityPages/ContactUs');
const NewTruckPdp = require('../../pages/PDP/NewTruckPdp');
const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');
const { runNewListingPagesSuite } = require('./newListingPagesSuite');
const { runCategoryListingLeadFormSuite } = require('./leadFormSuites/categoryListingLeadFormSuite');
const { runBusListingLeadFormSuite } = require('./leadFormSuites/busListingLeadFormSuite');
const { ALL_LEAD_LANG, suiteLangTags } = require('./leadFormSuites/shared');

const CATEGORY_LISTING_GROUPS = [
  {
    pageKeys: [
      'tippers',
      'trailers',
      'miniTrucks',
      'pickups',
      'transitMixer',
      'autoRickshaw',
      'tempoTraveller',
      'threeWheeler',
    ],
    tcPrefix: 'CL',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_CATEGORY,
  },
  {
    pageKeys: [
      'fourWheeler',
      'sixWheeler',
      'eightWheeler',
      'tenWheeler',
      'twelveWheeler',
      'fourteenWheeler',
      'sixteenWheeler',
      'eighteenWheeler',
      'twentyTwoWheeler',
    ],
    tcPrefix: 'CL',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_WHEELERS,
  },
  {
    pageKeys: ['diesel', 'petrol', 'cng', 'lpg', 'lng', 'hydrogen', 'biFuel'],
    tcPrefix: 'CL',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_FUEL,
  },
  {
    pageKeys: ['lcv', 'hcv', 'scv', 'icv'],
    tcPrefix: 'CL',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_GVW,
  },
  {
    pageKeys: ['tataBrand', 'ashokLeylandBrand', 'eicherBrand', 'mahindraBrand'],
    tcPrefix: 'TBR',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_BRANDS,
  },
  {
    pageKeys: ['tataAce', 'mahindraBlazo', 'mahindraBolero', 'ashokLeylandBoss', 'ashokLeylandDost'],
    tcPrefix: 'TSR',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_SERIES,
  },
  {
    pageKeys: ['under1Ton', 'ton1to2_5', 'ton2_5to5', 'ton5to10', 'ton10to20', 'ton20to40', 'ton40to300'],
    tcPrefix: 'PL',
    chunkTag: TEST_TAGS.ALL_LEAD_FORM_CHUNK_CAT_PAYLOAD,
  },
];

function registerHomepageTruckInIndiaLeadForms() {
  describe(`AllLeadForm - Homepage TruckInIndia [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags(
      [TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA],
      TEST_TAGS.ALL_LEAD_FORM_CHUNK_HOME
    ),
  }, () => {
    const page = new TruckInIndia(ALL_LEAD_LANG);
    const lead = () => page.leadFormCopy;
    const validation = () => page.leadFormCopy.validation;

    beforeEach(() => {
      page.navigate();
    });

    it('TC-TIY-17: Popular Check Offers submits lead and shows Thank You modal', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLeadFromTab('popular');
    });

    it('TC-TIY-18: Latest Check Offers submits lead and shows Thank You modal', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitCheckOffersLeadFromTab('latest');
    });

    it('TC-TIY-19: Upcoming Check Offers submits lead and shows Thank You modal', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitCheckOffersLeadFromTab('upcoming');
    });

    it('TC-TIY-20: Check Offers lead form shows required validation when submitted empty', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLeadExpectingValidation(
        'popular',
        { name: '', mobile: '', city: '', selectCity: false },
        [validation().nameRequired, validation().mobileRequired, validation().locationRequired]
      );
    });

    it('TC-TIY-21: Check Offers lead form rejects mobile that is not 10 digits', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA], TEST_TAGS.NEGATIVE),
    }, () => {
      page.submitCheckOffersLeadExpectingValidation(
        'popular',
        { name: lead().name, mobile: lead().invalidMobile, city: '', selectCity: false },
        [validation().mobileInvalid, validation().locationRequired]
      );
    });

    it('TC-TIY-22: Check Offers lead form requires location even when name and mobile are valid', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.TRUCK_IN_INDIA], TEST_TAGS.NEGATIVE),
    }, () => {
      page.submitCheckOffersLeadExpectingValidation(
        'popular',
        { name: lead().name, mobile: randomNumberGenerator(), city: '', selectCity: false },
        [validation().locationRequired]
      );
    });
  });
}

function registerHomepageElectricCommercialVehiclesLeadForms() {
  describe(`AllLeadForm - Homepage ElectricCommercialVehicles [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags(
      [TEST_TAGS.HOMEPAGE, TEST_TAGS.ELECTRIC_COMMERCIAL_VEHICLES],
      TEST_TAGS.ALL_LEAD_FORM_CHUNK_HOME
    ),
  }, () => {
    const page = new ElectricCommercialVehicles(ALL_LEAD_LANG);

    beforeEach(() => {
      page.navigate();
    });

    it('TC-ECV-03: one Check Offers lead submits successfully', {
      tags: suiteLangTags(
        [TEST_TAGS.HOMEPAGE, TEST_TAGS.ELECTRIC_COMMERCIAL_VEHICLES],
        TEST_TAGS.POSITIVE,
        TEST_TAGS.SMOKE
      ),
    }, () => {
      documentTestCase({
        id: 'TC-ECV-03',
        title: 'One Check Offers lead submits successfully',
        language: ALL_LEAD_LANG,
        description:
          'Open Check Offers once from a card in Electric Commercial Vehicles, fill name, mobile and city, and submit.',
        expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
        steps: ['Open Electric Commercial Vehicles', 'Open Check Offers', 'Fill and submit the lead form'],
      });
      allureStep('Submit one Check Offers lead', () => {
        page.submitOneCheckOffersLead();
      });
    });

    it('TC-ECV-05: Check Offers lead form shows required validation when submitted empty', {
      tags: suiteLangTags(
        [TEST_TAGS.HOMEPAGE, TEST_TAGS.ELECTRIC_COMMERCIAL_VEHICLES],
        TEST_TAGS.NEGATIVE,
        TEST_TAGS.SMOKE
      ),
    }, () => {
      const validation = page.leadFormCopy.validation;
      page.openCheckOffersLeadForm();
      page.leadForm.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.leadForm.submit();
      page.leadForm.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it('TC-ECV-06: Check Offers lead form rejects mobile that is not 10 digits', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.ELECTRIC_COMMERCIAL_VEHICLES], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.leadFormCopy;
      const validation = lead.validation;
      page.openCheckOffersLeadForm();
      page.leadForm.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.leadForm.submit();
      page.leadForm.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerHomepageLatestModelsByCategoryLeadForms() {
  describe(`AllLeadForm - Homepage LatestModelsByCategory [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags(
      [TEST_TAGS.HOMEPAGE, TEST_TAGS.LATEST_MODELS_BY_CATEGORY],
      TEST_TAGS.ALL_LEAD_FORM_CHUNK_HOME
    ),
  }, () => {
    const page = new LatestModelsByCategory(ALL_LEAD_LANG);
    const leadCases = [
      { id: 'TC-LMC-03', tabKey: 'threeWheelers' },
      { id: 'TC-LMC-04', tabKey: 'autoRickshaw' },
      { id: 'TC-LMC-05', tabKey: 'eRickshaw' },
      { id: 'TC-LMC-06', tabKey: 'miniTrucks' },
      { id: 'TC-LMC-07', tabKey: 'scv' },
    ];

    beforeEach(() => {
      page.navigate();
    });

    leadCases.forEach(({ id, tabKey }) => {
      it(`${id}: one Check Offers lead from ${tabKey} tab submits successfully`, {
        tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.LATEST_MODELS_BY_CATEGORY], TEST_TAGS.POSITIVE),
      }, () => {
        page.submitOneCheckOffersLeadFromTab(tabKey);
      });
    });

    it('TC-LMC-10: Check Offers lead form shows required validation when submitted empty', {
      tags: suiteLangTags(
        [TEST_TAGS.HOMEPAGE, TEST_TAGS.LATEST_MODELS_BY_CATEGORY],
        TEST_TAGS.NEGATIVE,
        TEST_TAGS.SMOKE
      ),
    }, () => {
      const validation = page.leadFormCopy.validation;
      page.openCheckOffersLeadForm();
      page.leadForm.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.leadForm.submit();
      page.leadForm.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it('TC-LMC-11: Check Offers lead form rejects mobile that is not 10 digits', {
      tags: suiteLangTags([TEST_TAGS.HOMEPAGE, TEST_TAGS.LATEST_MODELS_BY_CATEGORY], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.leadFormCopy;
      const validation = lead.validation;
      page.openCheckOffersLeadForm();
      page.leadForm.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.leadForm.submit();
      page.leadForm.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerCompareLeadForms() {
  describe(`AllLeadForm - CompareTrucks [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.COMPARE_TRUCKS]),
  }, () => {
    const page = new CompareTrucks(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-CT-01: Check Offers lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.COMPARE_TRUCKS], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLead();
    });

    it(`TC-CT-02: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.COMPARE_TRUCKS], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-CT-03: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.COMPARE_TRUCKS], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerBrochureLeadForms() {
  describe(`AllLeadForm - Brochure [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.BROCHURE]),
  }, () => {
    const page = new Brochure(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-BR-01: Download Brochure lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.BROCHURE], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLead();
    });

    page.bestSellingTabs.forEach((tabLabel, index) => {
      const tcNumber = String(index + 2).padStart(2, '0');
      it(`TC-BR-${tcNumber}: Download Brochure lead submits successfully from the "${tabLabel}" tab on ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.BROCHURE], TEST_TAGS.POSITIVE),
      }, () => {
        page.submitCheckOffersLeadFromTab(tabLabel);
      });
    });

    it(`TC-BR-05: Download Brochure lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.BROCHURE], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-BR-06: Download Brochure lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.BROCHURE], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerElectricVehicleLeadForms() {
  const page = new ElectricVehicle(ALL_LEAD_LANG);
  const pageLabel = page.pageLabel;

  describe(`AllLeadForm - ElectricVehicle [${ALL_LEAD_LANG}] — ${pageLabel}`, {
    tags: suiteLangTags([TEST_TAGS.CATEGORY_PAGES, TEST_TAGS.ELECTRIC_VEHICLE]),
  }, () => {
    beforeEach(() => {
      page.navigate();
    });

    it(`TC-EV-01: Check Truck Price lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.CATEGORY_PAGES, TEST_TAGS.ELECTRIC_VEHICLE], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckTruckPriceLead();
    });

    it(`TC-EV-02: Call Now assistance lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.CATEGORY_PAGES, TEST_TAGS.ELECTRIC_VEHICLE], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitCallNowLead();
    });

    it(`TC-EV-03: Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.CATEGORY_PAGES, TEST_TAGS.ELECTRIC_VEHICLE], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLeadViaCta(page.page.checkTruckPriceCta);
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-EV-04: Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.CATEGORY_PAGES, TEST_TAGS.ELECTRIC_VEHICLE], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLeadViaCta(page.page.checkTruckPriceCta);
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerBuyUsedTrucksLeadForms() {
  describe(`AllLeadForm - BuyUsedTrucks [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.BUY_USED_TRUCKS]),
  }, () => {
    const page = new BuyUsedTrucks(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-BUT-01: Contact Seller lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.BUY_USED_TRUCKS], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitGetSellerDetailsLead();
    });

    it(`TC-BUT-02: Contact Seller lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.BUY_USED_TRUCKS], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openGetSellerDetailsLead();
      page.getSellerDetailsLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.getSellerDetailsLead.submit();
      page.getSellerDetailsLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-BUT-03: Contact Seller lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.BUY_USED_TRUCKS], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openGetSellerDetailsLead();
      page.getSellerDetailsLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.getSellerDetailsLead.submit();
      page.getSellerDetailsLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerCvPermitLeadForms() {
  describe(`AllLeadForm - CvPermit [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.CV_PERMIT]),
  }, () => {
    const page = new CvPermit(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-CVP-01: Check Offers lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.CV_PERMIT], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLead();
    });

    it(`TC-CVP-02: Check Permit Info lead requests OTP successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.CV_PERMIT], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitGetInformationLead();
    });

    it(`TC-CVP-03: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.CV_PERMIT], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-CVP-04: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.CV_PERMIT], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerVehicleReportLeadForms() {
  describe(`AllLeadForm - VehicleReport [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.VEHICLE_REPORT]),
  }, () => {
    const page = new VehicleReport(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-VHR-01: Check Offers lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.VEHICLE_REPORT], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLead();
    });

    it(`TC-VHR-02: Contact Seller lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.VEHICLE_REPORT], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitContactSellerLead();
    });

    it(`TC-VHR-03: Check Vehicle Report lead requests OTP successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.VEHICLE_REPORT], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitGetInformationLead();
    });

    it(`TC-VHR-04: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.VEHICLE_REPORT], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLeadViaCta(page.page.checkOffers.leadTriggerCta);
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-VHR-05: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.VEHICLE_REPORT], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLeadViaCta(page.page.checkOffers.leadTriggerCta);
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerEChallanLeadForms() {
  describe(`AllLeadForm - EChallan [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.E_CHALLAN]),
  }, () => {
    const page = new EChallan(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-ECH-01: Check Offers lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.E_CHALLAN], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitCheckOffersLead();
    });

    it(`TC-ECH-02: Check Challan lead requests OTP successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.E_CHALLAN], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitGetInformationLead();
    });

    it(`TC-ECH-03: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.E_CHALLAN], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-ECH-04: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.E_CHALLAN], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerUsedTruckPdpLeadForms() {
  describe(`AllLeadForm - UsedTruckPdp [${ALL_LEAD_LANG}]`, {
    tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP]),
  }, () => {
    const page = new UsedTruckPdp(ALL_LEAD_LANG);
    const pageLabel = page.pageLabel;

    beforeEach(() => {
      page.navigate();
    });

    it(`TC-UTPDP-01: Contact Seller lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitContactSellerLead();
    });

    it(`TC-UTPDP-02: Contact Seller lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP], TEST_TAGS.NEGATIVE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openContactSellerLead();
      page.getSellerDetailsLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.getSellerDetailsLead.submit();
      page.getSellerDetailsLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-UTPDP-03: Contact Seller lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openContactSellerLead();
      page.getSellerDetailsLead.fillFields({
        name: lead.name,
        mobile: lead.invalidMobile,
        city: '',
        selectCity: false,
      });
      page.getSellerDetailsLead.submit();
      page.getSellerDetailsLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });

    it(`TC-UTPDP-04: Check Offers lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP], TEST_TAGS.POSITIVE),
    }, () => {
      page.submitCheckOffersLead();
    });

    it(`TC-UTPDP-05: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP], TEST_TAGS.NEGATIVE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-UTPDP-06: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.USED_TRUCK, TEST_TAGS.USED_TRUCK_PDP], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openCheckOffersLead();
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerBusPdpLeadForms() {
  BusPdp.pageKeys.forEach((pageKey) => {
    const page = new BusPdp(ALL_LEAD_LANG, pageKey);
    const pageLabel = page.pageLabel;

    describe(`AllLeadForm - BusPdp [${pageKey}] [${ALL_LEAD_LANG}] — ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.BUSES, TEST_TAGS.BUS_PDP], `@${pageKey}`),
    }, () => {
      beforeEach(() => {
        page.navigate();
      });

      it(`TC-BUSPDP-01: Check Offers lead submits successfully on ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.BUSES, TEST_TAGS.BUS_PDP], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, `@${pageKey}`),
      }, () => {
        page.submitCheckOffersLead();
      });

      it(`TC-BUSPDP-02: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.BUSES, TEST_TAGS.BUS_PDP], TEST_TAGS.NEGATIVE, `@${pageKey}`),
      }, () => {
        const validation = page.checkOffersLeadCopy.validation;
        page.openCheckOffersLead();
        page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
        page.checkOffersLead.submit();
        page.checkOffersLead.verifyValidationMessages([
          validation.nameRequired,
          validation.mobileRequired,
          validation.locationRequired,
        ]);
      });

      it(`TC-BUSPDP-03: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.BUSES, TEST_TAGS.BUS_PDP], TEST_TAGS.EDGE, `@${pageKey}`),
      }, () => {
        const lead = page.checkOffersLeadCopy;
        const validation = lead.validation;
        page.openCheckOffersLead();
        page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
        page.checkOffersLead.submit();
        page.checkOffersLead.verifyValidationMessages([validation.mobileRequired, validation.locationRequired]);
      });
    });
  });
}

function registerTabbedModelOffersLeadForms() {
  TabbedModelOffers.pageKeys.forEach((pageKey) => {
    const page = new TabbedModelOffers(ALL_LEAD_LANG, pageKey);
    const pageLabel = page.pageLabel;

    describe(`AllLeadForm - TabbedModelOffers [${pageKey}] [${ALL_LEAD_LANG}] — ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], `@${pageKey}`),
    }, () => {
      beforeEach(() => {
        page.navigate();
      });

      it(`TC-TMO-01: Check Offers lead submits successfully on every tab of ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, `@${pageKey}`),
      }, () => {
        page.submitLeadForEveryTab();
      });

      it(`TC-TMO-02: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, `@${pageKey}`),
      }, () => {
        const validation = page.checkOffersLeadCopy.validation;
        page.openLeadFormViaCta();
        page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
        page.checkOffersLead.submit();
        page.checkOffersLead.verifyValidationMessages([
          validation.nameRequired,
          validation.mobileRequired,
          validation.locationRequired,
        ]);
      });

      it(`TC-TMO-03: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
        tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.EDGE, `@${pageKey}`),
      }, () => {
        const lead = page.checkOffersLeadCopy;
        const validation = lead.validation;
        page.openLeadFormViaCta();
        page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
        page.checkOffersLead.submit();
        page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
      });
    });
  });
}

function registerTyresLeadForms() {
  const page = new Tyres(ALL_LEAD_LANG);
  const pageLabel = page.pageLabel;

  describe(`AllLeadForm - Tyres [${ALL_LEAD_LANG}] — ${pageLabel}`, {
    tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.ALL_LEAD_FORM_CHUNK_TYRES),
  }, () => {
    beforeEach(() => {
      page.navigate();
    });

    it(`TC-TYR-01: ${page.ctaLabel} lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitLead();
    });

    it(`TC-TYR-02: lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.checkOffersLeadCopy.validation;
      page.openLeadFormViaCta();
      page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
      ]);
    });

    it(`TC-TYR-03: lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.EDGE),
    }, () => {
      const lead = page.checkOffersLeadCopy;
      const validation = lead.validation;
      page.openLeadFormViaCta();
      page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
      page.checkOffersLead.submit();
      page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
    });
  });
}

function registerBodyMakersLeadForms() {
  const page = new BodyMakers(ALL_LEAD_LANG);
  const pageLabel = page.pageLabel;

  describe(`AllLeadForm - BodyMakers [${ALL_LEAD_LANG}] — ${pageLabel}`, {
    tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.ALL_LEAD_FORM_CHUNK_BODY_MAKERS),
  }, () => {
    beforeEach(() => {
      page.navigate();
    });

    it(`TC-BDM-01: Talk To Dealer lead submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      page.submitLead();
    });

    it(`TC-BDM-02: Talk To Dealer lead form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.validation;
      page.openLeadFormViaCta();
      page.fillFields({ name: '', mobile: '', city: '', selectCity: false });
      page.submit();
      page.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.locationRequired,
        validation.brandRequired,
        validation.modelRequired,
      ]);
    });

    it(`TC-BDM-03: Talk To Dealer lead form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES], TEST_TAGS.EDGE),
    }, () => {
      const validation = page.validation;
      page.openLeadFormViaCta();
      page.fillFields({ name: 'testqa', mobile: '12345', city: '', selectCity: false });
      page.submit();
      page.verifyValidationMessages([
        validation.mobileInvalid,
        validation.locationRequired,
        validation.brandRequired,
        validation.modelRequired,
      ]);
    });
  });
}

function registerContactUsLeadForms() {
  const page = new ContactUs(ALL_LEAD_LANG);
  const pageLabel = page.pageLabel;

  describe(`AllLeadForm - ContactUs [${ALL_LEAD_LANG}] — ${pageLabel}`, {
    tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES, TEST_TAGS.CONTACT_US]),
  }, () => {
    beforeEach(() => {
      page.navigate();
    });

    it(`TC-CUS-01: Submit Request enquiry submits successfully on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES, TEST_TAGS.CONTACT_US], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE),
    }, () => {
      cy.randomNumberGenerator().then((mobile) => {
        page.submitContactUsLead(mobile);
      });
    });

    it(`TC-CUS-02: Submit Request form shows required validation when submitted empty on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES, TEST_TAGS.CONTACT_US], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE),
    }, () => {
      const validation = page.copy.validation;
      page.ensureContactFormVisible();
      page.submitContactForm();
      page.verifyValidationMessages([
        validation.nameRequired,
        validation.mobileRequired,
        validation.emailRequired,
        validation.messageRequired,
      ]);
    });

    it(`TC-CUS-03: Submit Request form rejects mobile that is not 10 digits on ${pageLabel}`, {
      tags: suiteLangTags([TEST_TAGS.UTILITY_PAGES, TEST_TAGS.CONTACT_US], TEST_TAGS.EDGE),
    }, () => {
      const form = page.copy.form;
      const validation = page.copy.validation;
      page.fillContactForm({
        name: form.name,
        mobile: form.invalidMobile,
        email: '',
        message: '',
      });
      page.submitContactForm();
      page.verifyValidationMessages([
        validation.mobileInvalid,
        validation.emailRequired,
        validation.messageRequired,
      ]);
    });
  });
}

function registerNewTruckPdpLeadForms() {
  NewTruckPdp.productKeys.forEach((productKey) => {
    const page = new NewTruckPdp(ALL_LEAD_LANG, productKey);
    const productLabel = page.productLabel;

    describe(
      `AllLeadForm - NewTruckPdp [${productKey}] [${ALL_LEAD_LANG}] — ${productLabel}`,
      { tags: suiteLangTags([TEST_TAGS.PDP, TEST_TAGS.NEW_TRUCK_PDP], `@${productKey}`), testIsolation: false },
      function () {
        before(function () {
          page.navigate({ dismissLaunchLead: false });
        });

        it(`TC-NTPDP-01: Get Offers lead opens on launch for ${productLabel}`, {
          tags: suiteLangTags(
            [TEST_TAGS.PDP, TEST_TAGS.NEW_TRUCK_PDP],
            TEST_TAGS.POSITIVE,
            TEST_TAGS.SMOKE,
            `@${productKey}`
          ),
        }, () => {
          page.verifyGetOffersLeadVisible();
        });

        it(`TC-NTPDP-04: Get Offers lead shows validation when empty for ${productLabel}`, {
          tags: suiteLangTags([TEST_TAGS.PDP, TEST_TAGS.NEW_TRUCK_PDP], TEST_TAGS.NEGATIVE, `@${productKey}`),
        }, () => {
          page.submitGetOffersLeadExpectingValidation(
            { name: '', mobile: '', city: '' },
            [
              page.getOffersLeadCopy.validation.nameRequired,
              page.getOffersLeadCopy.validation.mobileRequired,
              page.getOffersLeadCopy.validation.locationRequired,
            ]
          );
        });

        it(`TC-NTPDP-03: Get Offers lead submits successfully for ${productLabel}`, {
          tags: suiteLangTags([TEST_TAGS.PDP, TEST_TAGS.NEW_TRUCK_PDP], TEST_TAGS.POSITIVE, `@${productKey}`),
        }, () => {
          page.submitGetOffersLead();
        });
      }
    );
  });
}

/**
 * Registers every UI lead-form test in English only, tagged @allLeadForm.
 * Excludes redirection checks, listing/PDP chrome, Sell Used Trucks wizard,
 * and pages with no lead forms (Content/Directory pages).
 *
 * Run desktop: npm run test:allLeadFormSuite
 * Run mobile:  npm run test:allLeadFormSuite:mobile
 */
function runAllLeadFormSuite() {
  registerHomepageTruckInIndiaLeadForms();
  registerHomepageElectricCommercialVehiclesLeadForms();
  registerHomepageLatestModelsByCategoryLeadForms();

  runNewListingPagesSuite(NewListingPages.pageKeys, {
    languages: [ALL_LEAD_LANG],
    skipRedirection: true,
    leadFormsOnly: true,
    extraTags: [TEST_TAGS.ALL_LEAD_FORM],
  });

  registerCompareLeadForms();
  registerBrochureLeadForms();
  registerElectricVehicleLeadForms();

  CATEGORY_LISTING_GROUPS.forEach(({ pageKeys, tcPrefix, chunkTag }) => {
    runCategoryListingLeadFormSuite({ pageKeys, tcPrefix, chunkTag });
  });

  registerBuyUsedTrucksLeadForms();
  registerCvPermitLeadForms();
  registerVehicleReportLeadForms();
  registerEChallanLeadForms();
  registerUsedTruckPdpLeadForms();

  runBusListingLeadFormSuite();
  registerBusPdpLeadForms();

  registerTabbedModelOffersLeadForms();
  registerTyresLeadForms();
  registerBodyMakersLeadForms();
  registerContactUsLeadForms();
  registerNewTruckPdpLeadForms();
}

module.exports = { runAllLeadFormSuite };

const UsedTruckPdp = require('../../../../pages/UsedTruck/UsedTruckPdp');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = UsedTruckPdp.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.USED_TRUCK,
  TEST_TAGS.USED_TRUCK_PDP,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new UsedTruckPdp(lang);
  const pageLabel = page.pageLabel;

  describe(`UsedTruck - UsedTruckPdp [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'UTPDP',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UsedTruck - ${pageLabel}`,
    });

    it(
      `TC-UTPDP-01: Contact Seller lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-01',
          title: `Contact Seller lead submits successfully on ${pageLabel}`,
          language: lang,
          description:
            'Open Buy Used Trucks, open the first unique listing, click Contact Seller, fill name, mobile and city, and submit.',
          expectedResult:
            'A Thank You For Contact confirmation is shown after a successful Get Seller Details submission. The submitted name is testqa.',
          steps: [
            'Open Buy Used Trucks',
            'Open the first unique used-truck listing',
            'Click Contact Seller',
            'Fill name, mobile and city',
            'Submit and verify Thank You For Contact',
          ],
        });

        allureStep(`Submit Contact Seller lead on ${pageLabel}`, () => {
          page.submitContactSellerLead();
        });
      }
    );

    if (lang === 'en') {
    it(
      `TC-UTPDP-02: Contact Seller lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-02',
          title: `Contact Seller lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description:
            'Open a used-truck detail page, click Contact Seller, and submit with name, mobile and city all left empty.',
          expectedResult:
            'The real required-field validation messages for name, mobile and location are shown, and no lead is submitted.',
          steps: [
            'Open a used-truck detail page',
            'Click Contact Seller',
            'Leave name, mobile and city empty and submit',
            'Verify the three required-field messages',
          ],
        });

        allureStep('Submit Contact Seller empty and verify validation', () => {
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
      }
    );

    it(
      `TC-UTPDP-03: Contact Seller lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-03',
          title: `Contact Seller lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description:
            'Open a used-truck detail page, click Contact Seller, fill a valid name, an invalid 5-digit mobile number, leave city empty, then submit.',
          expectedResult:
            'The mobile-format and location-required validation messages are shown, and no lead is submitted.',
          steps: [
            'Open a used-truck detail page',
            'Click Contact Seller',
            'Fill a valid name and an invalid mobile number',
            'Submit with city empty',
            'Verify mobile-format and location messages',
          ],
        });

        allureStep('Submit Contact Seller with invalid mobile', () => {
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
          page.getSellerDetailsLead.verifyValidationMessages([
            validation.mobileInvalid,
            validation.locationRequired,
          ]);
        });
      }
    );
    }

    it(
      `TC-UTPDP-04: Check Offers lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-04',
          title: `Check Offers lead submits successfully on ${pageLabel}`,
          language: lang,
          description: 'Open a used-truck detail page, click Check Offers, fill name, mobile and city, and submit.',
          expectedResult: 'A Thank You confirmation is shown after a successful Check Offers submission.',
          steps: [
            'Open a used-truck detail page',
            'Click Check Offers',
            'Fill name, mobile and city',
            'Submit and verify Thank You',
          ],
        });

        allureStep('Submit Check Offers lead on used truck detail', () => {
          page.submitCheckOffersLead();
        });
      }
    );

    if (lang === 'en') {
    it(
      `TC-UTPDP-05: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-05',
          title: `Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: 'Open Check Offers on a used-truck detail page and submit with name, mobile and city empty.',
          expectedResult: 'The real required-field validation messages are shown, and no lead is submitted.',
          steps: [
            'Open a used-truck detail page',
            'Click Check Offers',
            'Leave fields empty and submit',
            'Verify required-field messages',
          ],
        });

        allureStep('Submit Check Offers empty on used truck detail', () => {
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
      }
    );

    it(
      `TC-UTPDP-06: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-06',
          title: `Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description:
            'Open Check Offers on a used-truck detail page, fill a valid name and an invalid 5-digit mobile, leave city empty, then submit.',
          expectedResult: 'The mobile-format and location-required validation messages are shown.',
          steps: [
            'Open a used-truck detail page',
            'Click Check Offers',
            'Fill invalid mobile',
            'Verify mobile-format and location messages',
          ],
        });

        allureStep('Submit Check Offers with invalid mobile on used truck detail', () => {
          const lead = page.checkOffersLeadCopy;
          const validation = lead.validation;
          page.openCheckOffersLead();
          page.checkOffersLead.fillFields({
            name: lead.name,
            mobile: lead.invalidMobile,
            city: '',
            selectCity: false,
          });
          page.checkOffersLead.submit();
          page.checkOffersLead.verifyValidationMessages([
            validation.mobileInvalid,
            validation.locationRequired,
          ]);
        });
      }
    );
    }

    it(
      `TC-UTPDP-07: used truck detail heading is visible`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-UTPDP-07',
          title: 'Used truck detail heading is visible',
          language: lang,
          description: 'Confirm the used-truck detail page heading starts with Used.',
          expectedResult: 'The H1 is visible and starts with “Used ”.',
          steps: ['Open a used-truck detail page', 'Verify the heading'],
        });

        allureStep('Verify used truck detail heading', () => {
          page.verifyPageHeading();
        });
      }
    );
  });
});

const NewTruckPdp = require('../../../../pages/PDP/NewTruckPdp');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = NewTruckPdp.supportedLanguages;
const PRODUCT_KEYS = NewTruckPdp.productKeys;

/**
 * New Truck PDP — both most-popular and least-popular products in one spec.
 * Each UI block is its own `it` so a failure stays isolated to that block.
 *
 * Run:
 * - npm run test:newTruckPdp
 * - grepTags=@en+@newTruckPdp
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.PDP,
  TEST_TAGS.NEW_TRUCK_PDP,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const productTags = (productKey) => [`@${productKey}`];

LANGUAGES.forEach((lang) => {
  PRODUCT_KEYS.forEach((productKey) => {
    const page = new NewTruckPdp(lang, productKey);
    const productLabel = page.productLabel;

    describe(
      `PDP - NewTruckPdp [${productKey}] [${lang}] — ${productLabel}`,
      { tags: [...langTags(lang), ...productTags(productKey)], testIsolation: false },
      function () {
        before(function () {
          page.navigate({ dismissLaunchLead: false });
        });

        registerRedirectionCheck({
          prefix: 'NTPDP',
          lang,
          tags: langTags(lang, TEST_TAGS.REDIRECTION, ...productTags(productKey)),
          label: `PDP - New Truck PDP (${productLabel})`,
        });

        it(
          `TC-NTPDP-01: Get Offers lead opens on launch for ${productLabel}`,
          {
            tags: langTags(
              lang,
              TEST_TAGS.POSITIVE,
              TEST_TAGS.SMOKE,
              ...productTags(productKey)
            ),
          },
          function () {
            documentTestCase({
              id: 'TC-NTPDP-01',
              title: `Get Offers lead opens on launch for ${productLabel}`,
              language: lang,
              description: `Open the New Truck PDP for ${productLabel}. Confirm the Get Offers lead popup appears on page load with the correct offers title.`,
              expectedResult: `User sees “Check Latest Offers on ${productLabel}” with name, mobile, city fields and a Get Offers button.`,
              steps: [
                `Open ${productLabel} PDP without dismissing the launch popup`,
                'Verify Get Offers lead title and fields are visible',
              ],
            });

            allureStep('Verify Get Offers lead on launch (same session)', () => {
              page.verifyGetOffersLeadVisible();
            });
          }
        );

        it(
          `TC-NTPDP-04: Get Offers lead shows validation when empty for ${productLabel}`,
          {
            tags: langTags(lang, TEST_TAGS.NEGATIVE, ...productTags(productKey)),
          },
          function () {
            documentTestCase({
              id: 'TC-NTPDP-04',
              title: `Get Offers lead shows validation when empty for ${productLabel}`,
              language: lang,
              description:
                'Submit the launch Get Offers lead with empty name, mobile and city and confirm required-field messages.',
              expectedResult:
                'Validation messages appear for name, mobile and location; thank-you is not shown.',
              steps: [
                'With launch Get Offers lead still open from prior step',
                'Click Get Offers without filling fields',
                'Verify required validation messages',
              ],
            });

            allureStep('Submit empty Get Offers lead and verify validation', () => {
              page.submitGetOffersLeadExpectingValidation(
                { name: '', mobile: '', city: '' },
                [
                  page.getOffersLeadCopy.validation.nameRequired,
                  page.getOffersLeadCopy.validation.mobileRequired,
                  page.getOffersLeadCopy.validation.locationRequired,
                ]
              );
            });
          }
        );

        it(
          `TC-NTPDP-03: Get Offers lead submits successfully for ${productLabel}`,
          {
            tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)),
          },
          function () {
            documentTestCase({
              id: 'TC-NTPDP-03',
              title: `Get Offers lead submits successfully for ${productLabel}`,
              language: lang,
              description: `Fill name, mobile and city on the open Get Offers lead for ${productLabel} and submit.`,
              expectedResult:
                'User sees the thank-you confirmation after submitting Get Offers.',
              steps: [
                'On the same launch Get Offers lead after validation',
                'Enter name, mobile and city',
                'Click Get Offers',
                'Verify thank-you message',
              ],
            });

            allureStep('Submit Get Offers lead with valid details', () => {
              page.submitGetOffersLead();
            });
          }
        );

        it(
          `TC-NTPDP-02: Get Offers lead closes via Cross for ${productLabel}`,
          {
            tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)),
          },
          function () {
            documentTestCase({
              id: 'TC-NTPDP-02',
              title: `Get Offers lead closes via Cross for ${productLabel}`,
              language: lang,
              description: `Close the thank-you / lead overlay on ${productLabel} PDP using the Cross (Close) control.`,
              expectedResult:
                'The overlay disappears and the product page content is usable.',
              steps: [
                'After thank-you from lead submit',
                'Click Close (×)',
                'Verify the page hero is usable',
              ],
            });

            allureStep('Close lead overlay via Cross', () => {
              page.dismissBlockingOverlays();
              page.verifyHero();
            });
          }
        );

        describe('Page blocks (same session)', function () {
          before(function () {
            page.dismissBlockingOverlays();
          });

          beforeEach(function () {
            page.dismissBlockingOverlays();
          });

          it(
            `TC-NTPDP-05: SecondaryNavbar items for ${productLabel}`,
            {
              tags: langTags(
                lang,
                TEST_TAGS.POSITIVE,
                TEST_TAGS.SMOKE,
                ...productTags(productKey)
              ),
            },
          function () {
              if (!page.hasBlock('secondaryNavbar')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-05',
                title: `SecondaryNavbar items for ${productLabel}`,
                language: lang,
                description: `After the launch lead is closed, verify the SecondaryNavbar (sticky jump links) shows every expected item for ${productLabel}.`,
                expectedResult:
                  'SecondaryNavbar is visible and each expected link/label (Price, Specification, …) is shown.',
                steps: [
                  'Open PDP and close Get Offers lead',
                  'Locate SecondaryNavbar',
                  'Verify each expected nav item',
                ],
              });


              allureStep('Verify SecondaryNavbar items', () => {
                page.verifySecondaryNavbar();
              });
            }
          );

          it(
            `TC-NTPDP-06: Hero heading and primary CTAs for ${productLabel}`,
            {
              tags: langTags(
                lang,
                TEST_TAGS.POSITIVE,
                TEST_TAGS.SMOKE,
                ...productTags(productKey)
              ),
            },
          function () {
              if (!page.hasBlock('hero')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-06',
                title: `Hero heading and primary CTAs for ${productLabel}`,
                language: lang,
                description: `Confirm the product H1 and primary CTAs (Get On Road Price, Check Offers) on ${productLabel}.`,
                expectedResult:
                  'H1 matches the product name; Get On Road Price and Check Offers are visible.',
                steps: [
                  'Open PDP and close launch lead',
                  'Verify H1',
                  'Verify Get On Road Price and Check Offers',
                ],
              });


              allureStep('Verify hero heading and primary CTAs', () => {
                page.verifyHero();
              });
            }
          );

          it(
            `TC-NTPDP-07: Key Specs block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('keySpecs')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-07',
                title: `Key Specs block for ${productLabel}`,
                language: lang,
                description: `Scroll to Key Specs and verify expected spec labels for ${productLabel}.`,
                expectedResult:
                  'Key Specs heading and each expected label (GVW, Payload, …) are visible.',
                steps: [
                  'Open PDP',
                  'Scroll to Key Specs',
                  'Verify heading and spec labels',
                ],
              });


              allureStep('Verify Key Specs block', () => {
                page.verifyKeySpecs();
              });
            }
          );

          it(
            `TC-NTPDP-08: EMI block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('emi')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-08',
                title: `EMI block for ${productLabel}`,
                language: lang,
                description: `Verify the EMI section heading when present on ${productLabel}.`,
                expectedResult: 'EMI heading is visible, or the case is skipped if not on this PDP.',
                steps: ['Open PDP', 'Locate EMI heading if present'],
              });


              allureStep('Verify EMI block', () => {
                page.verifyEmi();
              });
            }
          );

          it(
            `TC-NTPDP-09: About block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('about')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-09',
                title: `About block for ${productLabel}`,
                language: lang,
                description: `Verify the About section for ${productLabel}.`,
                expectedResult: 'About heading is visible.',
                steps: ['Open PDP', 'Scroll to About', 'Verify heading'],
              });


              allureStep('Verify About block', () => {
                page.verifyAbout();
              });
            }
          );

          it(
            `TC-NTPDP-10: Expert Review block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('expertReview')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-10',
                title: `Expert Review block for ${productLabel}`,
                language: lang,
                description: `Verify Expert Review when present on ${productLabel}.`,
                expectedResult: 'Expert Review heading is visible, or skipped if not on this PDP.',
                steps: ['Open PDP', 'Locate Expert Review if present'],
              });


              allureStep('Verify Expert Review block', () => {
                page.verifyExpertReview();
              });
            }
          );

          it(
            `TC-NTPDP-11: Pros & Cons block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('prosCons')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-11',
                title: `Pros & Cons block for ${productLabel}`,
                language: lang,
                description: `Verify Pros & Cons when present on ${productLabel}.`,
                expectedResult: 'Pros & Cons heading is visible, or skipped if not on this PDP.',
                steps: ['Open PDP', 'Locate Pros & Cons if present'],
              });


              allureStep('Verify Pros & Cons block', () => {
                page.verifyProsCons();
              });
            }
          );

          it(
            `TC-NTPDP-12: Compare Alternatives block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('compareAlternatives')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-12',
                title: `Compare Alternatives block for ${productLabel}`,
                language: lang,
                description: `Verify Compare with Alternative section for ${productLabel}.`,
                expectedResult: 'Compare Alternatives heading is visible.',
                steps: ['Open PDP', 'Scroll to Compare Alternatives', 'Verify heading'],
              });


              allureStep('Verify Compare Alternatives block', () => {
                page.verifyCompareAlternatives();
              });
            }
          );

          it(
            `TC-NTPDP-13: Images block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('images')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-13',
                title: `Images block for ${productLabel}`,
                language: lang,
                description: `Verify Images section when present on ${productLabel}.`,
                expectedResult: 'Images heading is visible, or skipped if not on this PDP.',
                steps: ['Open PDP', 'Locate Images heading if present'],
              });


              allureStep('Verify Images block', () => {
                page.verifyImages();
              });
            }
          );

          it(
            `TC-NTPDP-14: Features block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('features')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-14',
                title: `Features block for ${productLabel}`,
                language: lang,
                description: `Verify Features section for ${productLabel}.`,
                expectedResult: 'Features heading is visible.',
                steps: ['Open PDP', 'Scroll to Features', 'Verify heading'],
              });


              allureStep('Verify Features block', () => {
                page.verifyFeatures();
              });
            }
          );

          it(
            `TC-NTPDP-15: Explore brand series block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('exploreBrandSeries')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-15',
                title: `Explore brand series block for ${productLabel}`,
                language: lang,
                description: `Verify Explore … Series when present on ${productLabel}.`,
                expectedResult: 'Explore brand series heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate Explore series if present'],
              });


              allureStep('Verify Explore brand series block', () => {
                page.verifyExploreBrandSeries();
              });
            }
          );

          it(
            `TC-NTPDP-16: Dealers, Service & Spare Parts for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('dealersServiceSpare')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-16',
                title: `Dealers, Service & Spare Parts for ${productLabel}`,
                language: lang,
                description: `Verify Dealers / Service / Spare Parts when present on ${productLabel}.`,
                expectedResult: 'Dealers heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate Dealers section if present'],
              });


              allureStep('Verify Dealers / Service / Spare Parts block', () => {
                page.verifyDealersServiceSpare();
              });
            }
          );

          it(
            `TC-NTPDP-17: Price in India block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('priceInIndia')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-17',
                title: `Price in India block for ${productLabel}`,
                language: lang,
                description: `Verify Price in India section for ${productLabel}.`,
                expectedResult: 'Price in India heading is visible.',
                steps: ['Open PDP', 'Scroll to Price in India', 'Verify heading'],
              });


              allureStep('Verify Price in India block', () => {
                page.verifyPriceInIndia();
              });
            }
          );

          it(
            `TC-NTPDP-18: Find Perfect Truck block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('findPerfectTruck')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-18',
                title: `Find Perfect Truck block for ${productLabel}`,
                language: lang,
                description: `Verify Find Perfect Truck when present on ${productLabel}.`,
                expectedResult: 'Find Perfect Truck heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate Find Perfect Truck if present'],
              });


              allureStep('Verify Find Perfect Truck block', () => {
                page.verifyFindPerfectTruck();
              });
            }
          );

          it(
            `TC-NTPDP-19: Reviews block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('userReviews')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-19',
                title: `Reviews block for ${productLabel}`,
                language: lang,
                description: `Verify User Reviews / Reviews for ${productLabel}.`,
                expectedResult: 'Reviews heading is visible.',
                steps: ['Open PDP', 'Scroll to Reviews', 'Verify heading'],
              });


              allureStep('Verify Reviews block', () => {
                page.verifyUserReviews();
              });
            }
          );

          it(
            `TC-NTPDP-20: News block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('news')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-20',
                title: `News block for ${productLabel}`,
                language: lang,
                description: `Verify News section when present on ${productLabel}.`,
                expectedResult: 'News heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate News if present'],
              });


              allureStep('Verify News block', () => {
                page.verifyNews();
              });
            }
          );

          it(
            `TC-NTPDP-21: Videos block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('videos')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-21',
                title: `Videos block for ${productLabel}`,
                language: lang,
                description: `Verify product Videos section when present on ${productLabel}.`,
                expectedResult: 'Videos heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate Videos if present'],
              });


              allureStep('Verify Videos block', () => {
                page.verifyVideos();
              });
            }
          );

          it(
            `TC-NTPDP-22: Electric Vehicle Videos for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('electricVehicleVideos')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-22',
                title: `Electric Vehicle Videos for ${productLabel}`,
                language: lang,
                description: `Verify Electric Vehicle Videos when present on ${productLabel}.`,
                expectedResult: 'Electric Vehicle Videos heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate EV Videos if present'],
              });


              allureStep('Verify Electric Vehicle Videos block', () => {
                page.verifyElectricVehicleVideos();
              });
            }
          );

          it(
            `TC-NTPDP-23: Usage block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('usage')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-23',
                title: `Usage block for ${productLabel}`,
                language: lang,
                description: `Verify Usage section when present on ${productLabel}.`,
                expectedResult: 'Usage heading is visible, or skipped.',
                steps: ['Open PDP', 'Locate Usage if present'],
              });


              allureStep('Verify Usage block', () => {
                page.verifyUsage();
              });
            }
          );

          it(
            `TC-NTPDP-24: FAQ block for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              if (!page.hasBlock('faq')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-24',
                title: `FAQ block for ${productLabel}`,
                language: lang,
                description: `Verify Frequently Asked Questions for ${productLabel}.`,
                expectedResult: 'FAQ heading is visible.',
                steps: ['Open PDP', 'Scroll to FAQ', 'Verify heading'],
              });


              allureStep('Verify FAQ block', () => {
                page.verifyFaq();
              });
            }
          );

          it(
            `TC-NTPDP-25: Book Free Test Drive CTA for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
          function () {
              documentTestCase({
                id: 'TC-NTPDP-25',
                title: `Book Free Test Drive CTA for ${productLabel}`,
                language: lang,
                description: `Confirm Book Free Test Drive is shown on ${productLabel}.`,
                expectedResult: 'Book Free Test Drive control is visible.',
                steps: ['Open PDP', 'Locate Book Free Test Drive', 'Verify visible'],
              });

              allureStep('Verify Book Free Test Drive CTA', () => {
                page.verifyBookFreeTestDriveCta();
              });
            }
          );

          it(
            `TC-NTPDP-26: SecondaryNavbar Calculate EMI jumps to the EMI calculator for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
            function () {
              if (!page.hasBlock('emi') || !page.hasBlock('secondaryNavbar')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-26',
                title: `SecondaryNavbar Calculate EMI jumps to the EMI calculator for ${productLabel}`,
                language: lang,
                description: `Use the SecondaryNavbar “Calculate EMI” jump link on ${productLabel} and confirm it takes the user to the on-page EMI calculator, not to a different page.`,
                expectedResult:
                  'The EMI calculator (Down Payment, tenure buttons and Monthly EMI) is shown after clicking Calculate EMI.',
                steps: [
                  'On the product page with launch lead closed',
                  'Click Calculate EMI on SecondaryNavbar',
                  'Verify the EMI calculator is shown',
                ],
              });

              allureStep('Click Calculate EMI on SecondaryNavbar', () => {
                page.clickSecondaryNavbarCalculateEmi();
              });
            }
          );

          it(
            `TC-NTPDP-27: EMI loan period change updates Monthly EMI for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...productTags(productKey)) },
            function () {
              if (!page.hasBlock('emi')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-27',
                title: `EMI loan period change updates Monthly EMI for ${productLabel}`,
                language: lang,
                description: `Change the EMI loan period on ${productLabel} from the default tenure to another listed option and confirm the Monthly EMI figure updates.`,
                expectedResult: 'Monthly EMI still shows a rupee amount and the figure is different after the tenure change.',
                steps: [
                  'Open the EMI calculator',
                  `Click loan period ${page.componentsCopy.emi.alternateTenure} months`,
                  'Verify Monthly EMI updates',
                ],
              });

              allureStep('Change EMI loan period and verify Monthly EMI updates', () => {
                page.selectEmiLoanPeriod(page.componentsCopy.emi.alternateTenure);
              });
            }
          );

          it(
            `TC-NTPDP-28: Dealers section switches to Service Center tab for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...productTags(productKey)) },
            function () {
              if (!page.hasBlock('dealersServiceSpare')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-28',
                title: `Dealers section switches to Service Center tab for ${productLabel}`,
                language: lang,
                description: `On the Dealers, Service Centers & Spare Parts block for ${productLabel}, switch from Dealers to Service Center.`,
                expectedResult: 'Service Center becomes the active tab.',
                steps: [
                  'Scroll to Dealers, Service Centers & Spare Parts',
                  'Click the Service Center tab',
                  'Verify Service Center is active',
                ],
              });

              allureStep('Switch Dealers block to Service Center', () => {
                page.openDealersTab('Service Center');
              });
            }
          );

          it(
            `TC-NTPDP-29: FAQ question expands to show an answer for ${productLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...productTags(productKey)) },
            function () {
              if (!page.hasBlock('faq')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NTPDP-29',
                title: `FAQ question expands to show an answer for ${productLabel}`,
                language: lang,
                description: `Open a Frequently Asked Question on ${productLabel} and confirm the answer text is shown.`,
                expectedResult: 'The selected question’s answer is visible.',
                steps: [
                  'Scroll to Frequently Asked Questions',
                  'Click a question',
                  'Verify the answer is shown',
                ],
              });

              allureStep('Expand an FAQ question and verify the answer', () => {
                page.expandFaqAccordion(0);
              });
            }
          );
        });
      }
    );
  });
});

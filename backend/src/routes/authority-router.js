const express = require("express");
const router = express.Router();
const log = require("../components/logger");
const config = require("../config/index");
const NodeCache = require("node-cache");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { checkToken } = require("../components/auth");
const { listCache } = require("../components/cache");
const {
  appendMailingAddressDetailsAndRemoveAddresses,
  rearrangeAndRelabelObjectProperties,
  sortByProperty,
} = require("../components/utils.js");
//Batch Routes
router.get("/all-mailing/:type", checkToken, getAllAuthorityMailing);
router.get("/:id", checkToken, getAuthority);
//router.get("/all-contacts", checkToken, getAllAuthorityContacts);

async function getAllAuthorityMailing(req, res) {
  //type = OFFSHORE or INDEPENDNT
  const { type } = req.params;

  const params = [
    {
      condition: null,
      searchCriteriaList: [
        {
          key: "closedDate",
          operation: "eq",
          value: null,
          valueType: "STRING",
          condition: "AND",
        },
        {
          key: "authorityTypeCode",
          operation: "eq",
          value: type,
          valueType: "STRING",
          condition: "AND",
        },
      ],
    },
  ];
  const jsonString = JSON.stringify(params);
  const encodedParams = encodeURIComponent(jsonString);
  const url = await `${config.get(
    "server:instituteAPIURL"
  )}/institute/authority/paginated?pageSize=1000&sort[authorityNumber]=ASC&searchCriteriaList=${encodedParams}`;
  try {
    const authorityResponse = await axios.get(url, {
      headers: { Authorization: `Bearer ${req.accessToken}` },
    });
    const propertyOrder = [
      { property: "authorityNumber", label: "Number" },
      { property: "displayName", label: "Name" },
      { property: "mailingAddressLine1", label: "Address" },
      { property: "mailingAddressLine2", label: "Address Line 2" },
      { property: "mailingCity", label: "City" },
      { property: "mailingProvinceCode", label: "Province" },
      { property: "mailingPostal", label: "Postal Code" },
      { property: "phoneNumber", label: "Phone Number" },
      { property: "faxNumber", label: "Fax" },
      { property: "email", label: "Email" },
    ];

    authorityResponse.data.content.forEach(
      appendMailingAddressDetailsAndRemoveAddresses
    );

    authorityResponse.data.content.forEach((currentElement, index, array) => {
      const rearrangedElement = rearrangeAndRelabelObjectProperties(
        currentElement,
        propertyOrder
      );
      array[index] = rearrangedElement;
    });
    const authorityResponseSorted = sortByProperty(
      authorityResponse.data.content,
      "Number"
    );

    res.json(authorityResponseSorted);
    //res.json(districtContactsReorderedAndRelabeled );
  } catch (e) {
    log.error("getData Error", e.response ? e.response.status : e.message);
  }
}
async function getDistrictCodes(req) {
  if (!listCache.has("districtCodesList")) {
    const url = `${config.get(
      "server:instituteAPIURL"
    )}/institute/authority-contact-type-codes`; // Update the URL according to your API endpoint
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${req.accessToken}` },
      });
      const districtCodeList = response.data;
      listCache.set("districtCodesList", districtCodeList);
      return districtCodeList;
    } catch (e) {
      log.error(
        "getDistrictList Error",
        e.response ? e.response.status : e.message
      );
    }
  } else {
    const districtCodeList = await listCache.get("districtCodesList");
    return districtCodeList;
  }
}
async function getAuthority(req, res) {
  const { id } = req.params;
  const params = [
    {
      condition: null,
      searchCriteriaList: [
        {
          key: "independentAuthorityId",
          operation: "eq",
          value: id, // Convert id to a string
          valueType: "UUID",
          condition: "AND",
        },
      ],
    },
  ];

  const jsonString = JSON.stringify(params);
  const encodedParams = encodeURIComponent(jsonString);

  const url = `${config.get(
    "server:instituteAPIURL"
  )}/institute/authority/${id}`;
  const authoritySchoolsUrl = `${config.get(
    "server:instituteAPIURL"
  )}/institute/school/paginated?pageNumber=0&pageSize=1000&searchCriteriaList=${encodedParams}`;

  try {
    const authorityDataResponse = await axios.get(url, {
      headers: { Authorization: `Bearer ${req.accessToken}` },
    });

    const authoritySchoolsResponse = await axios.get(authoritySchoolsUrl, {
      headers: { Authorization: `Bearer ${req.accessToken}` },
    });
    const today = new Date();
    const filteredSchoolsResponse =
      authoritySchoolsResponse.data.content.filter((obj) => {
        // If closedDate is null, keep the object
        if (obj.closedDate === null) {
          return true;
        }

        // If closedDate is a valid date greater than today, keep the object
        const closedDate = new Date(obj.closedDate);
        return closedDate > today;
      });
    const authorityJSON = {
      authorityData: authorityDataResponse.data,
      authoritySchools: filteredSchoolsResponse,
    };

    res.json(authorityJSON);
    log.info(req.url);
  } catch (e) {
    log.error("getData Error", e.response ? e.response.status : e.message);
  }
}
module.exports = router;

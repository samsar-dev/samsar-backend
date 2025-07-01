"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ReportReason = exports.ReportStatus = exports.ReportType = exports.ListingAction = exports.ListingStatus = exports.LanguageCode = exports.Condition = exports.TransmissionType = exports.FuelType = exports.PropertyType = exports.VehicleType = exports.ListingCategory = void 0;
// 🌟 Listing Categories
var ListingCategory;
(function (ListingCategory) {
    ListingCategory["VEHICLES"] = "vehicles";
    ListingCategory["REAL_ESTATE"] = "realEstate";
})(ListingCategory || (exports.ListingCategory = ListingCategory = {}));
// 🌟 Vehicle Types
var VehicleType;
(function (VehicleType) {
    VehicleType["CAR"] = "CAR";
    VehicleType["TRUCK"] = "TRUCK";
    VehicleType["VAN"] = "VAN";
    VehicleType["BUS"] = "BUS";
    VehicleType["MOTORCYCLE"] = "MOTORCYCLE";
    VehicleType["RV"] = "RV";
    VehicleType["CONSTRUCTION"] = "CONSTRUCTION";
    VehicleType["TRACTOR"] = "TRACTOR";
    VehicleType["OTHER"] = "OTHER";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
// 🌟 Property Types
var PropertyType;
(function (PropertyType) {
    PropertyType["HOUSE"] = "HOUSE";
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["CONDO"] = "CONDO";
    PropertyType["LAND"] = "LAND";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
    PropertyType["OTHER"] = "OTHER";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
// 🌟 Vehicle Details
var FuelType;
(function (FuelType) {
    FuelType["GASOLINE"] = "gasoline";
    FuelType["DIESEL"] = "diesel";
    FuelType["ELECTRIC"] = "electric";
    FuelType["HYBRID"] = "hybrid";
    FuelType["PLUGIN_HYBRID"] = "pluginHybrid";
    FuelType["LPG"] = "lpg";
    FuelType["CNG"] = "cng";
    FuelType["OTHER"] = "other";
})(FuelType || (exports.FuelType = FuelType = {}));
var TransmissionType;
(function (TransmissionType) {
    TransmissionType["AUTOMATIC"] = "automatic";
    TransmissionType["MANUAL"] = "manual";
    TransmissionType["SEMI_AUTOMATIC"] = "semiAutomatic";
    TransmissionType["CONTINUOUSLY_VARIABLE"] = "cvt";
    TransmissionType["DUAL_CLUTCH"] = "dualClutch";
    TransmissionType["OTHER"] = "other";
})(TransmissionType || (exports.TransmissionType = TransmissionType = {}));
var Condition;
(function (Condition) {
    Condition["NEW"] = "new";
    Condition["LIKE_NEW"] = "likeNew";
    Condition["EXCELLENT"] = "excellent";
    Condition["GOOD"] = "good";
    Condition["FAIR"] = "fair";
    Condition["POOR"] = "poor";
    Condition["SALVAGE"] = "salvage";
})(Condition || (exports.Condition = Condition = {}));
// 🌟 Settings Related Enums
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["EN"] = "en";
    LanguageCode["ES"] = "es";
    LanguageCode["FR"] = "fr";
    LanguageCode["DE"] = "de";
    LanguageCode["AR"] = "ar";
})(LanguageCode || (exports.LanguageCode = LanguageCode = {}));
// 🌟 Listing Status
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["ACTIVE"] = "active";
    ListingStatus["INACTIVE"] = "inactive";
    ListingStatus["SOLD"] = "sold";
    ListingStatus["RENTED"] = "rented";
    ListingStatus["PENDING"] = "pending";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
// 🌟 Listing Action Types
var ListingAction;
(function (ListingAction) {
    ListingAction["SALE"] = "SALE";
    ListingAction["RENT"] = "RENT";
})(ListingAction || (exports.ListingAction = ListingAction = {}));
// 🌟 Report System Enums
var ReportType;
(function (ReportType) {
    ReportType["USER"] = "user";
    ReportType["LISTING"] = "listing";
    ReportType["MESSAGE"] = "message";
    ReportType["COMMENT"] = "comment";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["INVESTIGATING"] = "investigating";
    ReportStatus["RESOLVED"] = "resolved";
    ReportStatus["DISMISSED"] = "dismissed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportReason;
(function (ReportReason) {
    ReportReason["SPAM"] = "spam";
    ReportReason["INAPPROPRIATE"] = "inappropriate";
    ReportReason["MISLEADING"] = "misleading";
    ReportReason["OFFENSIVE"] = "offensive";
    ReportReason["HARASSMENT"] = "harassment";
    ReportReason["OTHER"] = "other";
})(ReportReason || (exports.ReportReason = ReportReason = {}));
// 🌟 Notification Types
var NotificationType;
(function (NotificationType) {
    NotificationType["NEW_MESSAGE"] = "NEW_MESSAGE";
    NotificationType["LISTING_INTEREST"] = "LISTING_INTEREST";
    NotificationType["PRICE_UPDATE"] = "PRICE_UPDATE";
    NotificationType["LISTING_SOLD"] = "LISTING_SOLD";
    NotificationType["SYSTEM_NOTICE"] = "SYSTEM_NOTICE";
    NotificationType["LISTING_CREATED"] = "LISTING_CREATED";
    NotificationType["NEW_LISTING_MATCH"] = "NEW_LISTING_MATCH";
    NotificationType["ACCOUNT_WARNING"] = "ACCOUNT_WARNING";
    NotificationType["SYSTEM_ANNOUNCEMENT"] = "SYSTEM_ANNOUNCEMENT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=enums.js.map
-- Improve public directory search, filtering, and admin operational views.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX "Business_planId_idx" ON "Business"("planId");
CREATE INDEX "Business_listingStatus_updatedAt_idx" ON "Business"("listingStatus", "updatedAt");
CREATE INDEX "Business_listingStatus_verificationStatus_idx" ON "Business"("listingStatus", "verificationStatus");
CREATE INDEX "Business_listingStatus_averageRating_createdAt_idx" ON "Business"("listingStatus", "averageRating", "createdAt");
CREATE INDEX "Business_name_trgm_idx" ON "Business" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Business_description_trgm_idx" ON "Business" USING GIN ("description" gin_trgm_ops);
CREATE INDEX "Business_address_trgm_idx" ON "Business" USING GIN ("address" gin_trgm_ops);

CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX "Location_parentId_isActive_name_idx" ON "Location"("parentId", "isActive", "name");
CREATE INDEX "Location_isActive_type_name_idx" ON "Location"("isActive", "type", "name");
CREATE INDEX "BusinessHour_openNow_idx" ON "BusinessHour"("dayOfWeek", "isClosed", "opensAt", "closesAt");

CREATE INDEX "Review_businessId_status_createdAt_idx" ON "Review"("businessId", "status", "createdAt");
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");
CREATE INDEX "VerificationRequest_status_createdAt_idx" ON "VerificationRequest"("status", "createdAt");
CREATE INDEX "VerificationRequest_businessId_status_idx" ON "VerificationRequest"("businessId", "status");
CREATE INDEX "BusinessClaim_status_createdAt_idx" ON "BusinessClaim"("status", "createdAt");
CREATE INDEX "BusinessClaim_businessId_status_idx" ON "BusinessClaim"("businessId", "status");

CREATE INDEX "Subscription_businessId_status_endsAt_idx" ON "Subscription"("businessId", "status", "endsAt");
CREATE INDEX "Subscription_status_endsAt_idx" ON "Subscription"("status", "endsAt");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");
CREATE INDEX "Payment_businessId_createdAt_idx" ON "Payment"("businessId", "createdAt");
CREATE INDEX "Payment_provider_status_createdAt_idx" ON "Payment"("provider", "status", "createdAt");

CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_businessId_status_idx" ON "Report"("businessId", "status");
CREATE INDEX "Report_reviewId_status_idx" ON "Report"("reviewId", "status");
CREATE INDEX "FeaturedPlacement_status_endsAt_idx" ON "FeaturedPlacement"("status", "endsAt");
CREATE INDEX "FeaturedPlacement_businessId_status_endsAt_idx" ON "FeaturedPlacement"("businessId", "status", "endsAt");
CREATE INDEX "FeaturedPlacement_locationId_categoryId_status_endsAt_idx" ON "FeaturedPlacement"("locationId", "categoryId", "status", "endsAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

const { getSkuDetailsByReference, getComponentDetailsBySkuCode } = require('../models/model.getSkuReference');

/**
 * Controller to get SKU details by sku_reference
 */
async function getSkuDetailsByReferenceController(request, reply) {
  try {
    const { sku_reference } = request.params;
    
    // Validate required parameter
    if (!sku_reference || sku_reference.trim() === '') {
      return reply.code(400).send({ 
        success: false, 
        message: 'SKU reference is required' 
      });
    }

    const skuDetails = await getSkuDetailsByReference(sku_reference);
    
    if (skuDetails.length === 0) {
      return reply.code(404).send({ 
        success: false, 
        message: 'No SKU details found for the provided SKU reference',
        sku_reference: sku_reference
      });
    }

    // Get component details for each SKU code and organize them
    const organizedData = [];
    const skuCodes = [...new Set(skuDetails.map(item => item.sku_code))]; // Remove duplicates
    let totalComponents = 0;
    
    for (const skuCode of skuCodes) {
      // Find all SKU details for this SKU code
      const skuInfoList = skuDetails.filter(item => item.sku_code === skuCode);
      
      // Get components for this SKU code
      const componentDetails = await getComponentDetailsBySkuCode(skuCode);
      totalComponents += componentDetails.length;
      
      // Format components for this SKU
      const formattedComponents = componentDetails.map(item => ({
        id: item.id,
        sku_code: item.sku_code,
        formulation_reference: item.formulation_reference,
        material_type_id: item.material_type_id,
        components_reference: item.components_reference,
        component_code: item.component_code,
        component_description: item.component_description,
        component_valid_from: item.component_valid_from,
        component_valid_to: item.component_valid_to,
        component_material_group: item.component_material_group,
        component_quantity: item.component_quantity,
        component_uom_id: item.component_uom_id,
        component_base_quantity: item.component_base_quantity,
        component_base_uom_id: item.component_base_uom_id,
        percent_w_w: item.percent_w_w,
        evidence: item.evidence,
        component_packaging_type_id: item.component_packaging_type_id,
        component_packaging_material: item.component_packaging_material,
        helper_column: item.helper_column,
        component_unit_weight: item.component_unit_weight,
        weight_unit_measure_id: item.weight_unit_measure_id,
        percent_mechanical_pcr_content: item.percent_mechanical_pcr_content,
        percent_mechanical_pir_content: item.percent_mechanical_pir_content,
        percent_chemical_recycled_content: item.percent_chemical_recycled_content,
        percent_bio_sourced: item.percent_bio_sourced,
        material_structure_multimaterials: item.material_structure_multimaterials,
        component_packaging_color_opacity: item.component_packaging_color_opacity,
        component_packaging_level_id: item.component_packaging_level_id,
        component_dimensions: item.component_dimensions,
        packaging_specification_evidence: item.packaging_specification_evidence,
        evidence_of_recycled_or_bio_source: item.evidence_of_recycled_or_bio_source,
        last_update_date: item.last_update_date,
        category_entry_id: item.category_entry_id,
        data_verification_entry_id: item.data_verification_entry_id,
        user_id: item.user_id,
        signed_off_by: item.signed_off_by,
        signed_off_date: item.signed_off_date,
        mandatory_fields_completion_status: item.mandatory_fields_completion_status,
        evidence_provided: item.evidence_provided,
        document_status: item.document_status,
        is_active: item.is_active,
        created_by: item.created_by,
        created_date: item.created_date,
        year: item.year,
        component_unit_weight_id: item.component_unit_weight_id,
        cm_code: item.cm_code,
        periods: item.periods
      }));

      // Create entry for each SKU detail (in case same SKU code has different periods)
      for (const skuInfo of skuInfoList) {
        const formattedSkuInfo = {
          id: skuInfo.id,
          sku_code_with_period: `${skuInfo.sku_code} (${skuInfo.period || 'N/A'})`,
          sku_code: skuInfo.sku_code,
          site: skuInfo.site,
          sku_description: skuInfo.sku_description,
          cm_code: skuInfo.cm_code,
          cm_description: skuInfo.cm_description,
          sku_reference: skuInfo.sku_reference,
          period: skuInfo.period,
          is_active: skuInfo.is_active,
          created_by: skuInfo.created_by,
          created_date: skuInfo.created_date,
          purchased_quantity: skuInfo.purchased_quantity,
          sku_reference_check: skuInfo.sku_reference_check,
          formulation_reference: skuInfo.formulation_reference,
          dual_source_sku: skuInfo.dual_source_sku
        };

        organizedData.push({
          sku_info: formattedSkuInfo,
          components: formattedComponents
        });
      }
    }
    
    reply.code(200).send({ 
      success: true, 
      sku_reference: sku_reference,
      total_skus: skuDetails.length,
      total_components: totalComponents,
      data: organizedData
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to fetch SKU details by reference', 
      error: error.message 
    });
  }
}

module.exports = {
  getSkuDetailsByReferenceController
}; 
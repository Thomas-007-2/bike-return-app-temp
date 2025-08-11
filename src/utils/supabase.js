import {createClient} from '@supabase/supabase-js' 

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL 
const supabaseKey=import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase=createClient(supabaseUrl,supabaseKey)

export const createReport = async (orderId, status, description, merchantId) => {
  try {
    console.log('Creating report with:', { orderId, status, description, merchantId });
    
    // Generate a unique submission ID
    const submissionId = `${orderId}_${merchantId}_${Date.now()}`
    
    // First check if a report already exists for this order and merchant
    const { data: existingReport, error: checkError } = await supabase
      .from('return_reports')
      .select('*')
      .eq('order_id', orderId)
      .eq('merchant_id', merchantId)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking for existing report:', checkError);
      // Continue with insert attempt even if check fails
    }
    
    if (existingReport) {
      console.log(`Report already exists for order ${orderId} and merchant ${merchantId}:`, existingReport);
      // Return the existing report to prevent duplicate creation
      return existingReport;
    }
    
    // Format the Vienna timestamp
    const viennaTime = new Date().toLocaleString('en-CA', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/,/g, '');
    
    console.log('Inserting new report with Vienna time:', viennaTime);
    
    // If no existing report, create a new one
    const { data, error } = await supabase
      .from('return_reports')
      .insert([
        {
          order_id: orderId,
          merchant_id: merchantId,
          status,
          description,
          submission_id: submissionId,
          created_at_vienna: viennaTime
        }
      ])
      .select();
    
    if (error) {
      console.error('Error inserting report:', error);
      
      // If we get a unique constraint violation, it means another process created the report
      // in the time between our check and insert. In that case, we fetch the existing report.
      if (error.code === '23505') { // Unique constraint violation
        console.log('Unique constraint violation, fetching existing report');
        const { data: existingReport, error: fetchError } = await supabase
          .from('return_reports')
          .select('*')
          .eq('order_id', orderId)
          .eq('merchant_id', merchantId)
          .single();
        
        if (fetchError) {
          console.error('Error fetching existing report after constraint violation:', fetchError);
          throw fetchError;
        }
        
        return existingReport;
      }
      
      throw error;
    }
    
    console.log('Report created successfully:', data?.[0]);
    return data?.[0];
  } catch (error) {
    console.error('Unexpected error in createReport:', error);
    throw error;
  }
}

export const uploadPhoto = async (file, orderId, merchantId) => {
  try {
    // Generate unique filename 
    const fileExt = 'jpg' // Always use jpg extension for compressed images
    const fileName = `${orderId}_${Date.now()}.${fileExt}` 
    const filePath = `${merchantId}/${orderId}/${fileName}` 

    console.log('Uploading photo:', { orderId, merchantId, fileName });

    // Upload file to storage 
    const {data: uploadData, error: uploadError} = await supabase.storage 
      .from('return-photos') 
      .upload(filePath, file, {
        contentType: 'image/jpeg' // Set content type to JPEG
      }) 

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      throw uploadError;
    }

    console.log('Photo uploaded successfully:', uploadData);

    // Create photo record 
    const {data: photoData, error: photoError} = await supabase 
      .from('return_photos') 
      .insert([ 
        {
          order_id: orderId,
          merchant_id: merchantId,
          file_name: fileName,
          file_path: filePath
        } 
      ]) 
      .select() 

    if (photoError) {
      console.error('Error creating photo record:', photoError);
      throw photoError;
    }

    console.log('Photo record created:', photoData?.[0]);
    return {upload: uploadData, photo: photoData?.[0]};
  } catch (error) {
    console.error('Unexpected error in uploadPhoto:', error);
    throw error;
  }
}

export const callWebhook = async (orderId, storeId) => {
  try {
    console.log('Calling webhook for:', { orderId, storeId });
    
    const response = await fetch('https://cloud.activepieces.com/api/v1/webhooks/ZQWjCysxyz4YAUgjMQSeb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        store_id: storeId,
        all_ok: 'yes'
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Webhook called successfully:', result);
    return result;
  } catch (error) {
    console.error('Error calling webhook:', error);
    throw error;
  }
}

export const getMerchantConfig=async (merchantId)=> {
  try {
    console.log('Getting merchant config for:', merchantId);
    
    const {data, error}=await supabase 
      .from('merchant_configurations') 
      .select('*') 
      .eq('merchant_id', merchantId) 
      .single() 

    if (error) {
      console.warn('No merchant configuration found for:', merchantId, 'Using defaults');
      return null;
    }

    console.log('Merchant config found:', data);
    return data;
  } catch (error) {
    console.error('Error getting merchant config:', error);
    return null;
  }
}
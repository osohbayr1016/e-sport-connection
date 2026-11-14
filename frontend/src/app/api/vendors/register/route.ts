import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const storeName = formData.get('storeName') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string;
    const bankAccount = formData.get('bankAccount') as string;
    const taxId = formData.get('taxId') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const contactPhone = formData.get('contactPhone') as string;
    const contactEmail = formData.get('contactEmail') as string;
    const socialMedia = JSON.parse(formData.get('socialMedia') as string);
    const businessHours = JSON.parse(formData.get('businessHours') as string);
    const deliveryAreas = JSON.parse(formData.get('deliveryAreas') as string);
    const paymentMethods = JSON.parse(formData.get('paymentMethods') as string);
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!storeName || !description || !category || !address || !phone || !email || !bankAccount || !contactPerson || !contactPhone || !contactEmail) {
      return NextResponse.json(
        { message: 'Бүх заавал оруулах талбаруудыг бөглөнө үү' },
        { status: 400 }
      );
    }

    // Generate unique vendor ID
    const vendorId = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create vendor data object
    const vendorData = {
      id: vendorId,
      userId,
      storeName,
      description,
      category,
      address,
      phone,
      email,
      website: website || null,
      bankAccount,
      taxId: taxId || null,
      contactPerson,
      contactPhone,
      contactEmail,
      socialMedia,
      businessHours,
      deliveryAreas,
      paymentMethods,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logo: null,
      banner: null,
      businessLicense: null,
    };

    // Handle file uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'vendors', vendorId);
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Handle logo upload
    const logoFile = formData.get('logo') as File;
    if (logoFile) {
      const logoBytes = await logoFile.arrayBuffer();
      const logoBuffer = Buffer.from(logoBytes);
      const logoExtension = logoFile.name.split('.').pop();
      const logoFileName = `logo.${logoExtension}`;
      const logoPath = join(uploadDir, logoFileName);
      await writeFile(logoPath, logoBuffer);
      vendorData.logo = `/uploads/vendors/${vendorId}/${logoFileName}`;
    }

    // Handle banner upload
    const bannerFile = formData.get('banner') as File;
    if (bannerFile) {
      const bannerBytes = await bannerFile.arrayBuffer();
      const bannerBuffer = Buffer.from(bannerBytes);
      const bannerExtension = bannerFile.name.split('.').pop();
      const bannerFileName = `banner.${bannerExtension}`;
      const bannerPath = join(uploadDir, bannerFileName);
      await writeFile(bannerPath, bannerBuffer);
      vendorData.banner = `/uploads/vendors/${vendorId}/${bannerFileName}`;
    }

    // Handle business license upload
    const licenseFile = formData.get('businessLicense') as File;
    if (licenseFile) {
      const licenseBytes = await licenseFile.arrayBuffer();
      const licenseBuffer = Buffer.from(licenseBytes);
      const licenseExtension = licenseFile.name.split('.').pop();
      const licenseFileName = `license.${licenseExtension}`;
      const licensePath = join(uploadDir, licenseFileName);
      await writeFile(licensePath, licenseBuffer);
      vendorData.businessLicense = `/uploads/vendors/${vendorId}/${licenseFileName}`;
    }

    // Here you would typically save to database
    // For now, we'll just log the data and return success
    console.log('Vendor registration data:', vendorData);

    // Simulate database save
    // await saveVendorToDatabase(vendorData);

    // Send notification email to admin (simulated)
    console.log(`New vendor registration: ${storeName} (${vendorId}) - Status: Pending Review`);

    return NextResponse.json({
      success: true,
      message: 'Дэлгүүрийн бүртгэл амжилттай хадгалагдлаа',
      vendorId,
      status: 'pending',
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    return NextResponse.json(
      { message: 'Дэлгүүрийн бүртгэлд алдаа гарлаа' },
      { status: 500 }
    );
  }
}

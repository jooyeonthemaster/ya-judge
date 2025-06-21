import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    // Validate required fields
    if (!id || !password) {
      return NextResponse.json(
        { error: 'ID and password are required' },
        { status: 400 }
      );
    }

    // Import Firebase functions
    const { database } = await import('@/lib/firebase');
    const { ref, get, set } = await import('firebase/database');

    if (!database) {
      console.error('Firebase database is not initialized');
      return NextResponse.json(
        { error: 'Database connection failed - Firebase not initialized' },
        { status: 500 }
      );
    }

    // Check if admin account exists
    const adminRef = ref(database, `account/admin/${id}`);
    const adminSnapshot = await get(adminRef);

    if (!adminSnapshot.exists()) {
      // If admin account doesn't exist and this is the master admin, create it
      if (id === 'nadr1106') {
        const hashedPassword = await bcrypt.hash('@nadr1106', 12);
        await set(adminRef, {
          id: 'nadr1106',
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          role: 'admin'
        });
        
        // Verify the password against the newly created hash
        const isValid = await bcrypt.compare(password, hashedPassword);
        
        if (isValid) {
          return NextResponse.json({
            success: true,
            message: 'Admin account created and authenticated successfully',
            user: {
              id: 'nadr1106',
              role: 'admin'
            }
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get stored admin data
    const adminData = adminSnapshot.val();
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminData.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login time
    await set(ref(database, `account/admin/${id}/lastLogin`), new Date().toISOString());

    // Successful authentication
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: adminData.id,
        role: adminData.role || 'admin'
      }
    });

  } catch (error) {
    console.error('Admin authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Initialize admin account if needed (optional GET endpoint for setup)
export async function GET() {
  try {
    const { database } = await import('@/lib/firebase');
    const { ref, get, set } = await import('firebase/database');

    if (!database) {
      console.error('Firebase database is not initialized in GET method');
      return NextResponse.json(
        { error: 'Database connection failed - Firebase not initialized' },
        { status: 500 }
      );
    }

    // Check if master admin exists
    const adminRef = ref(database, 'account/admin/nadr1106');
    const adminSnapshot = await get(adminRef);

    if (!adminSnapshot.exists()) {
      // Create master admin account
      const hashedPassword = await bcrypt.hash('@nadr1106', 12);
      await set(adminRef, {
        id: 'nadr1106',
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        role: 'admin',
        isActive: true
      });

      return NextResponse.json({
        message: 'Master admin account initialized successfully'
      });
    }

    return NextResponse.json({
      message: 'Admin account already exists'
    });

  } catch (error) {
    console.error('Admin initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
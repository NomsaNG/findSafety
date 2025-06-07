import { type NextRequest, NextResponse } from "next/server";

// GET handler
export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  const { params } = context;
  const path = params.path.join("/");
  const queryString = request.nextUrl.search;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    const response = await fetch(`${apiUrl}/${path}${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying GET request to /${path}:`, error);
    return NextResponse.json({ error: "Failed to fetch data from API gethandler" }, { status: 500 });
  }
}

// POST handler
export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  const { params } = context;
  const path = params.path.join("/");
  const queryString = request.nextUrl.search;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    const body = await request.json();

    const response = await fetch(`${apiUrl}/${path}${queryString}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("Content-Type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      console.error(`Unexpected response format: ${text}`);
      return NextResponse.json({ error: "Unexpected response format from API" }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error proxying POST request to /${path}:`, error);
    return NextResponse.json({ error: "Failed to fetch data from API posthandler" }, { status: 500 });
  }
}

// PUT handler
export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  const { params } = context;
  const path = params.path.join("/");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    const body = await request.json();

    const response = await fetch(`${apiUrl}/${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying PUT request to /${path}:`, error);
    return NextResponse.json({ error: "Failed to update data in API puthandler" }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  const { params } = context;
  const path = params.path.join("/");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    const response = await fetch(`${apiUrl}/${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying DELETE request to /${path}:`, error);
    return NextResponse.json({ error: "Failed to delete data in API deletehandler" }, { status: 500 });
  }
}

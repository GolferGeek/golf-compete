// ... inside POST handler ...
    // A common pattern is to return the URL Supabase *would* redirect to.
    // Get the URL for redirecting
    const oauthResponse = await supabase.auth.signInWithOAuth({ provider }); // Await the promise

    // Check for errors during URL generation
    if (oauthResponse.error || !oauthResponse.data?.url) {
        console.error('[API /auth/oauth] Failed to get OAuth URL after initiation attempt:', oauthResponse.error);
        return createErrorApiResponse('Failed to generate OAuth redirect URL.', 'OAUTH_URL_ERROR', 500);
    }
    
    // Perform the redirect server-side using the obtained URL:
    return NextResponse.redirect(oauthResponse.data.url, 302); 

  } catch (error: any) {
// ... rest of handler ...

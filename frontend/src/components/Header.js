import { Box, Container, Button, Heading, HStack, Text } from '@chakra-ui/react';

function Header({ isAuthenticated, user, onLoginOpen, onCartOpen, onLogout, cartCount }) {
  return (
    <Box bg="white" boxShadow="sm" py={4} mb={8}>
      <Container maxW="container.lg">
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="red.500">
            🍽️ Food Delivery
          </Heading>
          <HStack spacing={4}>
            {isAuthenticated ? (
              <>
                <Text fontSize="sm">Hi, {user?.email}</Text>
                <Button
                  colorScheme="red"
                  size="sm"
                  variant="outline"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button colorScheme="red" size="sm" variant="outline" onClick={onLoginOpen}>
                Sign In
              </Button>
            )}
            <Button colorScheme="red" size="sm" onClick={onCartOpen}>
              Cart ({cartCount})
            </Button>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}

export default Header;

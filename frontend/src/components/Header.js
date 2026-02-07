import { Box, Container, Button, Heading, HStack, Text, Link as ChakraLink } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

function Header({ isAuthenticated, user, onLoginOpen, onCartOpen, onLogout, cartCount }) {
  return (
    <Box bg="white" boxShadow="sm" py={4} mb={8}>
      <Container maxW="container.lg">
        <HStack justify="space-between" align="center">
          <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <Heading size="lg" color="red.500" cursor="pointer">
              🍽️ Food Delivery
            </Heading>
          </ChakraLink>
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

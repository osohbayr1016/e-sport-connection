import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

// Mock the contexts
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/SocketContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;

// Mock fetch globally
global.fetch = jest.fn();

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should handle markAsSeen with optimistic updates', async () => {
    const mockToken = 'test-token';
    const mockNotificationId = 'notification-123';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await act(async () => {
      await result.current.markAsSeen(mockNotificationId);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/notifications/${mockNotificationId}/read`),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle markAsSeen API failure with rollback', async () => {
    const mockToken = 'test-token';
    const mockNotificationId = 'notification-123';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await act(async () => {
      await result.current.markAsSeen(mockNotificationId);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/notifications/${mockNotificationId}/read`),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle network errors gracefully', async () => {
    const mockToken = 'test-token';
    const mockNotificationId = 'notification-123';
    
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(mockToken),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    await act(async () => {
      await result.current.markAsSeen(mockNotificationId);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/notifications/${mockNotificationId}/read`),
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle missing token gracefully', async () => {
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockReturnValue(null),
    } as any);

    mockUseSocket.mockReturnValue({
      socket: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.markAsSeen('notification-123');
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
